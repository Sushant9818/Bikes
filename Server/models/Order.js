const mongoose = require('mongoose');

const { Schema } = mongoose;

const orderItemSchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['bike', 'part'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      validate: [(val) => val.length > 0, 'Order must have at least one item'],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'usd',
    },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'STOCK_FAILED'],
      default: 'PENDING',
      index: true,
    },
    stripeSessionId: {
      type: String,
      index: true,
    },
    paymentIntentId: {
      type: String,
      index: true,
    },
    orderRef: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    stockFailureReason: {
      type: [
        {
          productId: Schema.Types.ObjectId,
          type: String,
          reason: String,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.index({ createdAt: 1 });
orderSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model('Order', orderSchema);

