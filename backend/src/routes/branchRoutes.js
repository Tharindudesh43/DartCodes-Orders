const express = require('express');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const { createBranch, listBranches, updateBranch } = require('../controllers/branchController');

const router = express.Router();

router.get('/', auth, listBranches);
router.post('/', auth, requireAdmin, createBranch);
router.patch('/:id', auth, requireAdmin, updateBranch);

module.exports = router;
