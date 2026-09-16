const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
      default: '',
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['none', 'percentage', 'flat'],
      default: 'none',
    },
    discountValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.virtual('effectivePrice').get(function () {
  if (this.discountType === 'percentage') {
    const pct = Math.min(this.discountValue, 100);
    return Math.round(this.price * (1 - pct / 100) * 100) / 100;
  }
  if (this.discountType === 'flat') {
    return Math.max(this.price - this.discountValue, 0);
  }
  return this.price;
});

module.exports = mongoose.model('Product', productSchema);
