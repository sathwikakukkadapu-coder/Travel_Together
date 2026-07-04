const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── protect ──────────────────────────────────────────────
/**
 * Verifies the Bearer JWT in Authorization header.
 * Attaches the decoded user document to req.user.
 * Blocks deactivated accounts.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  try {
    // Verify signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach fresh user doc (never includes password due to select:false)
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact support.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.',
    });
  }
};

// ─── adminOnly ────────────────────────────────────────────
/**
 * Must be used AFTER protect.
 * Allows access only to users with role === 'admin'.
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Admins only.',
  });
};

// ─── optionalProtect ──────────────────────────────────────
/**
 * Like protect but does NOT block unauthenticated requests.
 * Use on routes that behave differently for logged-in users
 * but are also publicly accessible.
 */
const optionalProtect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return next(); // no token — continue as guest

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id);
    if (user && user.isActive) req.user = user;
  } catch {
    // invalid token on optional route — silently ignore
  }

  next();
};

module.exports = { protect, adminOnly, optionalProtect };
