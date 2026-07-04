const express = require('express');
const router  = express.Router();
const rateLimit = require('express-rate-limit');

const {
  register,
  login,
  getMe,
  updateMe,
  logout,
  changePassword,
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

const {
  validateRegister,
  validateLogin,
  validateChangePassword,
} = require('../middleware/validators/authValidators');

// ─── Rate Limiter: max 10 auth attempts per 15 minutes per IP ─────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Public Routes ────────────────────────────────────────

/**
 * POST /api/auth/register
 * Validate input → create user → return JWT
 */
router.post('/register', authLimiter, validateRegister, register);

/**
 * POST /api/auth/login
 * Validate input → verify credentials → return JWT
 */
router.post('/login', authLimiter, validateLogin, login);

// ─── Protected Routes  ────────────────────────────────────
// All routes below require a valid Bearer token

/**
 * GET /api/auth/me
 * Returns the current user + their profile document
 */
router.get('/me', protect, getMe);

/**
 * PUT /api/auth/me
 * Update the current user's display name
 */
router.put('/me', protect, updateMe);

/**
 * POST /api/auth/logout
 * Informs the client to discard the token
 */
router.post('/logout', protect, logout);

/**
 * PUT /api/auth/change-password
 * Validates body → verifies current password → hashes + saves new one
 */
router.put('/change-password', protect, validateChangePassword, changePassword);

module.exports = router;
