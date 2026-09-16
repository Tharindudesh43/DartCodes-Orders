const SupportMessage = require('../models/SupportMessage');
const { classifyNote } = require('../services/classificationService');

// POST /api/support
async function submitMessage(req, res) {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'A message is required' });
    }
    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message is too long (max 1000 characters)' });
    }

    const classification = await classifyNote(message);

    const supportMessage = await SupportMessage.create({
      customer: req.user.id,
      message: message.trim(),
      classification: {
        category: classification.category,
        confidence: classification.confidence,
        isUncertain: classification.isUncertain,
        topCandidate: classification.topCandidate,
      },
    });

    return res.status(201).json({ supportMessage });
  } catch (err) {
    console.error('submitMessage error:', err);
    return res.status(500).json({ error: 'Something went wrong sending your message' });
  }
}

// GET /api/support   (admin only - the support inbox)
async function listMessages(req, res) {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter['classification.category'] = category;

    const messages = await SupportMessage.find(filter)
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });

    return res.json({ messages });
  } catch (err) {
    console.error('listMessages error:', err);
    return res.status(500).json({ error: 'Something went wrong fetching messages' });
  }
}

// PATCH /api/support/:id   (admin only - mark resolved/open)
async function updateMessageStatus(req, res) {
  try {
    const { status } = req.body;
    if (!['open', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'status must be "open" or "resolved"' });
    }
    const supportMessage = await SupportMessage.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!supportMessage) return res.status(404).json({ error: 'Message not found' });
    return res.json({ supportMessage });
  } catch (err) {
    console.error('updateMessageStatus error:', err);
    return res.status(500).json({ error: 'Something went wrong updating the message' });
  }
}

module.exports = { submitMessage, listMessages, updateMessageStatus };
