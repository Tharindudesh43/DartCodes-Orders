const express = require('express');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const { setStock, listStock } = require('../controllers/stockController');

const router = express.Router();

router.get('/', auth, listStock);
router.put('/', auth, requireAdmin, setStock);

module.exports = router;
