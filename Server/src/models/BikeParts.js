const mongoose = require('mongoose');

const partSchema = new mongoose.Schema({
  name: { type: String, required: true },
  imageUrl: String,
  category: String,
  price: { type: Number, required: true },
  inStock: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('BikePart', partSchema);
