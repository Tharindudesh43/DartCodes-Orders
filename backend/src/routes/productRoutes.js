const express = require('express');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const { createProduct, listProducts } = require('../controllers/productController');

const router = express.Router();

router.get('/', auth, listProducts);
router.post('/', auth, requireAdmin, createProduct);

module.exports = router;
