const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { allocateAndReserve, releaseAllocation } = require('../services/allocationService');
const { classifyNote } = require('../services/classificationService');

// POST /api/orders
async function createOrder(req, res) {
  try {
    const { items, deliveryLocation, note } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must include at least one item' });
    }
    for (const item of items) {
      if (!item.product || !mongoose.isValidObjectId(item.product)) {
        return res.status(400).json({ error: 'Each item must have a valid product id' });
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return res.status(400).json({ error: 'Each item quantity must be a positive integer' });
      }
    }
    if (
      !deliveryLocation ||
      typeof deliveryLocation.lat !== 'number' ||
      typeof deliveryLocation.lng !== 'number' ||
      !deliveryLocation.address
    ) {
      return res.status(400).json({ error: 'A valid deliveryLocation (lat, lng, address) is required' });
    }

    // Look up current prices to snapshot onto the order.
    const products = await Product.find({ _id: { $in: items.map((i) => i.product) } });
    if (products.length !== items.length) {
      return res.status(400).json({ error: 'One or more products were not found' });
    }
    const priceByProduct = new Map(products.map((p) => [String(p._id), p.price]));

    const orderItems = items.map((i) => ({
      product: i.product,
      quantity: i.quantity,
      priceAtOrder: priceByProduct.get(String(i.product)),
    }));

    // Allocate the order to a branch and classify the note in parallel.
    const [allocation, classification] = await Promise.all([
      allocateAndReserve(orderItems, deliveryLocation),
      classifyNote(note),
    ]);

    const order = await Order.create({
      customer: req.user.id,
      items: orderItems,
      deliveryLocation,
      note: note || '',
      classification: {
        category: classification.category,
        confidence: classification.confidence,
        isUncertain: classification.isUncertain,
      },
      branch: allocation.branch ? allocation.branch._id : null,
      status: allocation.branch ? 'allocated' : 'unfulfillable',
      statusHistory: [
        {
          status: allocation.branch ? 'allocated' : 'unfulfillable',
          changedAt: new Date(),
          changedBy: null,
        },
      ],
      allocationDetails: {
        candidatesConsidered: allocation.candidatesConsidered,
        winningScore: allocation.score ?? null,
      },
    });

    const statusCode = allocation.branch ? 201 : 200;
    return res.status(statusCode).json({
      order,
      allocated: Boolean(allocation.branch),
      message: allocation.branch
        ? undefined
        : 'No branch could fully stock this order right now. It has been recorded as unfulfillable — an admin can review and retry.',
    });
  } catch (err) {
    console.error('createOrder error:', err);
    return res.status(500).json({ error: 'Something went wrong creating the order' });
  }
}

// GET /api/orders
async function listOrders(req, res) {
  try {
    const { status, branch, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (req.user.role !== 'ADMIN') {
      filter.customer = req.user.id;
    }
    if (status) filter.status = status;
    if (branch && mongoose.isValidObjectId(branch)) filter.branch = branch;
    if (search) {
      filter.$or = [
        { note: { $regex: search, $options: 'i' } },
        { 'deliveryLocation.address': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('branch', 'name')
        .populate('customer', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(filter),
    ]);

    return res.json({ orders, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('listOrders error:', err);
    return res.status(500).json({ error: 'Something went wrong fetching orders' });
  }
}

// GET /api/orders/:id
async function getOrder(req, res) {
  try {
    const order = await Order.findById(req.params.id)
      .populate('branch', 'name location')
      .populate('customer', 'name email')
      .populate('items.product', 'name sku');

    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (req.user.role !== 'ADMIN' && String(order.customer._id) !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this order' });
    }

    return res.json({ order });
  } catch (err) {
    console.error('getOrder error:', err);
    return res.status(500).json({ error: 'Something went wrong fetching the order' });
  }
}

// PATCH /api/orders/:id/status  (admin only)
const VALID_STATUSES = ['pending', 'allocated', 'processing', 'shipped', 'cancelled', 'unfulfillable'];

async function updateOrderStatus(req, res) {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (status === 'cancelled' && order.status !== 'cancelled' && order.branch) {
      await releaseAllocation(order.branch, order.items);
    }

    order.status = status;
    order.statusHistory.push({ status, changedAt: new Date(), changedBy: req.user.id });
    await order.save();

    return res.json({ order });
  } catch (err) {
    console.error('updateOrderStatus error:', err);
    return res.status(500).json({ error: 'Something went wrong updating the order' });
  }
}

module.exports = { createOrder, listOrders, getOrder, updateOrderStatus };
