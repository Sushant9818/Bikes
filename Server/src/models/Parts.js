const mongoose = require('mongoose');

const partSchema = new mongoose.Schema({
  name: String,
  category: String,
  description: String,
  price: Number,
  inStock: Boolean,
  imageUrl: String,
});

module.exports = mongoose.model('Part', partSchema);