const express = require('express');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const {
  submitMessage,
  listMessages,
  updateMessageStatus,
} = require('../controllers/supportController');

const router = express.Router();

router.use(auth);

router.post('/', submitMessage);
router.get('/', listMessages);
router.patch('/:id', requireAdmin, updateMessageStatus);

module.exports = router;
