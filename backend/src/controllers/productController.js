const Product = require('../models/Product');

// POST /api/products (admin)
async function createProduct(req, res) {
  try {
    const { name, sku, price } = req.body;
    if (!name || !sku || typeof price !== 'number' || price < 0) {
      return res.status(400).json({ error: 'name, sku, and a non-negative price are required' });
    }
    const existing = await Product.findOne({ sku: sku.toUpperCase() });
    if (existing) {
      return res.status(409).json({ error: 'A product with that SKU already exists' });
    }
    const product = await Product.create({ name, sku, price });
    return res.status(201).json({ product });
  } catch (err) {
    console.error('createProduct error:', err);
    return res.status(500).json({ error: 'Something went wrong creating the product' });
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

module.exports = { createProduct, listProducts };
