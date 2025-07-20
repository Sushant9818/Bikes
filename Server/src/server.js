const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const partRoutes = require('./routes/partRoutes');
const bikeRoutes = require('./routes/bikeRoutes'); // clean import
const mongoose = require('mongoose');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/parts', partRoutes);
app.use('/api/bikes', bikeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/utils', utilsRoutes);

// Health check route (optional)
app.get('/', (req, res) => {
  res.send('MotoParts API is running');
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));