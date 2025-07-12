// scripts/createAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../src/models/User');

const createAdmin = async () => {
  try {
    console.log('⏳ Connecting to MongoDB...');
    console.log('🔍 MONGO_URI:', process.env.MONGO_URI);

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB connected');

    const existing = await User.findOne({ username: 'admin' });
    console.log('🔎 Existing admin found:', existing);

    if (existing) {
      console.log('✅ Admin already exists.');
      return process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      name: 'Admin User',
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
    });

    console.log('📝 Saving admin to database...');
    await admin.save();

    console.log('✅ Admin created successfully!');
    console.log('➡️  Username: admin');
    console.log('➡️  Password: admin123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin:', err);
    process.exit(1);
  }
};

createAdmin();