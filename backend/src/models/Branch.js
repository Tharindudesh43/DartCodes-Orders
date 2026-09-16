const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
    },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      address: { type: String, default: '', trim: true },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    currentLoad: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxCapacity: {
      type: Number,
      default: 20,
      min: 1,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Branch', branchSchema);
