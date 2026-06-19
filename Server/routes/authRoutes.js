const express = require('express');

const router = express.Router();
const {
  register,
  login,
  verifyEmail,
  resendVerification,
} = require('../controllers/authController');

// Detailed logging specifically for register endpoint
function logRegisterRequest(req, _res, next) {
  // eslint-disable-next-line no-console
  console.log('[/api/auth/register] headers:', req.headers);
  // eslint-disable-next-line no-console
  console.log('[/api/auth/register] body:', req.body);
  next();
}

// POST /api/auth/register
router.post('/register', logRegisterRequest, register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/verify-email
router.get('/verify-email', verifyEmail);

// POST /api/auth/resend-verification
router.post('/resend-verification', resendVerification);

module.exports = router;

