const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: 1000,
    },
    classification: {
      category: { type: String, default: null },
      confidence: { type: Number, default: null },
      isUncertain: { type: Boolean, default: false },
      topCandidate: { type: String, default: null },
    },
    status: {
      type: String,
      enum: ['open', 'resolved'],
      default: 'open',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupportMessage', supportMessageSchema);
