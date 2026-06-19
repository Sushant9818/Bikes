require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const paymentsRouter = require('./routes/payments');
const paymentsController = require('./controllers/paymentsController');
const adminAnalyticsRouter = require('./routes/adminAnalytics');

if (!process.env.PORT) {
  // eslint-disable-next-line no-console
  console.warn('PORT not set; defaulting to 8081');
}

const PORT = process.env.PORT || 8081;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGO_URI) {
  // Fail fast if DB connection string is missing
  // eslint-disable-next-line no-console
  console.error('MONGO_URI is not set in environment variables');
  process.exit(1);
}

if (!JWT_SECRET) {
  // JWT signing secret must be configured for security
  // eslint-disable-next-line no-console
  console.error('JWT_SECRET is not set in environment variables');
  process.exit(1);
}

async function startServer() {
  try {
    // Connect to MongoDB before starting the HTTP server
    await mongoose.connect(MONGO_URI, {
      dbName: undefined,
      autoIndex: true,
    });

    // eslint-disable-next-line no-console
    console.log('✅ MongoDB connected');

    const app = express();

    // CORS first
    app.use(
      cors({
        origin: ['http://localhost:5173', 'http://localhost:3000'],
        credentials: true,
      }),
    );

    // HTTP request logging
    app.use(morgan('dev'));

    // Stripe webhook uses raw body – must be BEFORE JSON parser
    app.post(
      '/api/payments/webhook',
      express.raw({ type: 'application/json' }),
      paymentsController.handleStripeWebhook,
    );

    // Body parsers for all other routes
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Request body logging for debugging
    app.use((req, _res, next) => {
      if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        // eslint-disable-next-line no-console
        console.log(`[${req.method}] ${req.originalUrl} body:`, req.body);
      }
      next();
    });

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api', paymentsRouter);
    app.use('/api/admin/analytics', adminAnalyticsRouter);

    // 404 handler for unknown routes
    app.use((req, res, next) => {
      const error = new Error(`Not Found - ${req.originalUrl}`);
      error.statusCode = 404;
      next(error);
    });

    // Centralized error-handling middleware
    // eslint-disable-next-line no-unused-vars
    app.use((err, _req, res, _next) => {
      // eslint-disable-next-line no-console
      console.error('Error handler:', err);

      const status = err.statusCode || err.status || 500;
      const message = err.message || 'Internal server error';

      // Normalize known validation / duplicate errors if they reach here without status
      if (!err.statusCode && err.name === 'ValidationError') {
        return res.status(400).json({
          message: 'Validation error',
          details: err.errors,
          stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
        });
      }

      if (!err.statusCode && err.code === 11000) {
        return res.status(409).json({
          message: 'Email already registered',
          stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
        });
      }

      return res.status(status).json({
        message,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
      });
    });

    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`🚀 Express server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

startServer();

