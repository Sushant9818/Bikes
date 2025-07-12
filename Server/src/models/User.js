// src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  username: { type: String, required: true, unique: true },
  email: String,
  password: String,
  role: { type: String, default: 'user' },
  resetToken: String,
resetTokenExpiry: Date,

});

module.exports = mongoose.model('User', userSchema);