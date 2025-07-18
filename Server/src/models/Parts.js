// src/models/Part.js
const mongoose = require('mongoose');

const partSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    imageUrl: String,
    category: String,
    price: { type: Number, required: true },
    inStock: { type: Boolean, default: true },
    quantity: { type: Number, default: 0 }, // 👈 Make sure quantity is here
  },
  { timestamps: true }
);

module.exports = mongoose.model('Part', partSchema);