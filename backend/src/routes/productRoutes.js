const express = require('express');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const { createProduct, updateProduct, listProducts } = require('../controllers/productController');

const router = express.Router();

router.get('/', auth, listProducts);
router.post('/', auth, requireAdmin, createProduct);
router.patch('/:id', auth, requireAdmin, updateProduct);

module.exports = router;
