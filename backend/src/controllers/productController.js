const Product = require('../models/Product');

const DISCOUNT_TYPES = ['none', 'percentage', 'flat'];

function validateDiscount(discountType, discountValue, price) {
  if (discountType !== undefined && !DISCOUNT_TYPES.includes(discountType)) {
    return `discountType must be one of: ${DISCOUNT_TYPES.join(', ')}`;
  }
  if (discountValue !== undefined) {
    if (typeof discountValue !== 'number' || discountValue < 0) {
      return 'discountValue must be a non-negative number';
    }
    if (discountType === 'percentage' && discountValue > 100) {
      return 'A percentage discount cannot exceed 100';
    }
    if (discountType === 'flat' && price !== undefined && discountValue > price) {
      return 'A flat discount cannot exceed the product price';
    }
  }
  return null;
}

// POST /api/products   (admin)
async function createProduct(req, res) {
  try {
    const { name, sku, price, image, discountType, discountValue } = req.body;
    if (!name || !sku || typeof price !== 'number' || price < 0) {
      return res.status(400).json({ error: 'name, sku, and a non-negative price are required' });
    }

    const discountError = validateDiscount(discountType, discountValue, price);
    if (discountError) return res.status(400).json({ error: discountError });

    const existing = await Product.findOne({ sku: sku.toUpperCase() });
    if (existing) {
      return res.status(409).json({ error: 'A product with that SKU already exists' });
    }

    const product = await Product.create({
      name,
      sku,
      price,
      image: image || '',
      discountType: discountType || 'none',
      discountValue: discountValue || 0,
    });
    return res.status(201).json({ product });
  } catch (err) {
    console.error('createProduct error:', err);
    return res.status(500).json({ error: 'Something went wrong creating the product' });
  }
}

// PATCH /api/products/:id   (admin)
async function updateProduct(req, res) {
  try {
    const { name, sku, price, image, discountType, discountValue, isActive } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const effectivePrice = price !== undefined ? price : product.price;
    const discountError = validateDiscount(
      discountType !== undefined ? discountType : product.discountType,
      discountValue !== undefined ? discountValue : product.discountValue,
      effectivePrice
    );
    if (discountError) return res.status(400).json({ error: discountError });

    if (sku !== undefined) {
      const existing = await Product.findOne({
        sku: sku.toUpperCase(),
        _id: { $ne: product._id },
      });
      if (existing) {
        return res.status(409).json({ error: 'A product with that SKU already exists' });
      }
      product.sku = sku;
    }

    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = price;
    if (image !== undefined) product.image = image;
    if (discountType !== undefined) product.discountType = discountType;
    if (discountValue !== undefined) product.discountValue = discountValue;
    if (isActive !== undefined) product.isActive = Boolean(isActive);

    await product.save();
    return res.json({ product });
  } catch (err) {
    console.error('updateProduct error:', err);
    return res.status(500).json({ error: 'Something went wrong updating the product' });
  }
}

// GET /api/products
async function listProducts(req, res) {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    const products = await Product.find(filter).sort({ name: 1 });
    return res.json({ products });
  } catch (err) {
    console.error('listProducts error:', err);
    return res.status(500).json({ error: 'Something went wrong fetching products' });
  }
}

module.exports = { createProduct, updateProduct, listProducts };
