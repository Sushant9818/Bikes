const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

const JWT_SECRET = process.env.JWT_SECRET;

function validateRegisterInput(body) {
  const errors = {};

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.name = 'Name is required';
  }

  if (!body.email || typeof body.email !== 'string') {
    errors.email = 'Email is required';
  } else {
    const email = body.email.toLowerCase().trim();
    // Basic RFC-compliant-ish email pattern for server-side validation
    // eslint-disable-next-line no-control-regex
    const emailRegex =
      // eslint-disable-next-line no-useless-escape
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.email = 'Email is invalid';
    }
  }

  if (!body.password || typeof body.password !== 'string') {
    errors.password = 'Password is required';
  } else if (body.password.length < 8) {
    errors.password = 'Password must be at least 8 characters long';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

exports.register = async (req, res, next) => {
  try {
    // Debug log for incoming payload
    // eslint-disable-next-line no-console
    console.log('Register request body:', req.body);

    const { isValid, errors } = validateRegisterInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        message: 'Validation error',
        errors,
      });
    }

    const name = req.body.name.trim();
    const email = req.body.email.toLowerCase().trim();
    const password = req.body.password;

    const existing = await User.findOne({ email }).lean().exec();
    if (existing) {
      return res.status(409).json({
        message: 'Email already registered',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      emailVerified: false,
      emailVerificationTokenHash: tokenHash,
      emailVerificationTokenExpires: expires,
    });

    const baseUrl =
      process.env.EMAIL_VERIFY_BASE_URL || 'http://localhost:3000/verify-email';
    const verifyUrl = `${baseUrl}?token=${rawToken}&email=${encodeURIComponent(email)}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Verify your email',
        html: `<p>Hi ${user.name},</p>
<p>Thanks for registering. Please verify your email by clicking the link below:</p>
<p><a href="${verifyUrl}">${verifyUrl}</a></p>
<p>If you did not create this account, you can ignore this email.</p>`,
      });
    } catch (mailErr) {
      // eslint-disable-next-line no-console
      console.error('Failed to send verification email', mailErr);
    }

    return res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    // Handle MongoDB duplicate key error explicitly if it occurs here
    if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
      err.statusCode = 409;
      err.message = 'Email already registered';
    }

    return next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      '+password +emailVerificationTokenHash +emailVerificationTokenExpires',
    );

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.emailVerified) {
      return res.status(403).json({ message: 'Please verify your email.' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
      },
      JWT_SECRET,
      {
        expiresIn: '7d',
      },
    );

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
      },
      token,
    });
  } catch (err) {
    return next(err);
  }
};

// GET /api/auth/verify-email?token=XXX&email=YYY
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token, email } = req.query;
    if (!token || !email) {
      return res.status(400).json({ message: 'Token and email are required' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      emailVerificationTokenHash: tokenHash,
      emailVerificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification link' });
    }

    user.emailVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationTokenExpires = undefined;
    await user.save();

    return res.status(200).json({ message: 'Email verified successfully.' });
  } catch (err) {
    return next(err);
  }
};

// POST /api/auth/resend-verification
exports.resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Do not reveal that user does not exist
      return res
        .status(200)
        .json({ message: 'If this email exists, a verification link has been sent.' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified.' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationTokenHash = tokenHash;
    user.emailVerificationTokenExpires = expires;
    await user.save();

    const baseUrl =
      process.env.EMAIL_VERIFY_BASE_URL || 'http://localhost:3000/verify-email';
    const verifyUrl = `${baseUrl}?token=${rawToken}&email=${encodeURIComponent(
      user.email,
    )}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Verify your email',
        html: `<p>Hi ${user.name},</p>
<p>Please verify your email by clicking the link below:</p>
<p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
      });
    } catch (mailErr) {
      // eslint-disable-next-line no-console
      console.error('Failed to send verification email', mailErr);
    }

    return res
      .status(200)
      .json({ message: 'If this email exists, a verification link has been sent.' });
  } catch (err) {
    return next(err);
  }
};

