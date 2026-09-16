const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    priceAtOrder: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'allocated', 'processing', 'shipped', 'cancelled', 'unfulfillable'],
      required: true,
    },
    changedAt: { type: Date, default: Date.now },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    deliveryLocation: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String, required: true, trim: true },
    },
    note: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    classification: {
      category: { type: String, default: null },
      confidence: { type: Number, default: null },
      isUncertain: { type: Boolean, default: false },
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'allocated', 'processing', 'shipped', 'cancelled', 'unfulfillable'],
      default: 'pending',
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    allocationDetails: {
      candidatesConsidered: { type: Number, default: 0 },
      winningScore: { type: Number, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
