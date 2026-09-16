const mongoose = require('mongoose');

const branchStockSchema = new mongoose.Schema(
  {
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  { timestamps: true }
);

branchStockSchema.index({ branch: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('BranchStock', branchStockSchema);
