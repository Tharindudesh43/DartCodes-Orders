const mongoose = require('mongoose');
const BranchStock = require('../models/BranchStock');

//PUT /api/stock (admin)
async function setStock(req, res) {
  try {
    const { branch, product, quantity } = req.body;
    if (
      !mongoose.isValidObjectId(branch) ||
      !mongoose.isValidObjectId(product) ||
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      return res.status(400).json({ error: 'Valid branch id, product id, and non-negative integer quantity are required' });
    }

    const stock = await BranchStock.findOneAndUpdate(
      { branch, product },
      { $set: { quantity } },
      { new: true, upsert: true }
    );

    return res.json({ stock });
  } catch (err) {
    console.error('setStock error:', err);
    return res.status(500).json({ error: 'Something went wrong setting stock' });
  }
}

//GET /api/stock?branch=...
async function listStock(req, res) {
  try {
    const { branch } = req.query;
    const filter = {};
    if (branch && mongoose.isValidObjectId(branch)) filter.branch = branch;

    const stock = await BranchStock.find(filter)
      .populate('branch', 'name')
      .populate('product', 'name sku');

    return res.json({ stock });
  } catch (err) {
    console.error('listStock error:', err);
    return res.status(500).json({ error: 'Something went wrong fetching stock' });
  }
}

module.exports = { setStock, listStock };
