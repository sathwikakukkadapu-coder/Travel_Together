/**
 * Auth Validators
 * Express middleware functions that validate request bodies
 * before they reach the controller. Each returns 400 on failure.
 */

// ─── Helpers ──────────────────────────────────────────────

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const NAME_REGEX  = /^[a-zA-Z\s'-]+$/; // letters, spaces, hyphens, apostrophes

const fail = (res, message) =>
  res.status(400).json({ success: false, message });

// ─── Validators ───────────────────────────────────────────

/**
 * Validate POST /api/auth/register
 * Required: name, email, password
 */
const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !name.trim()) {
    return fail(res, 'Name is required');
  }
  if (name.trim().length < 2) {
    return fail(res, 'Name must be at least 2 characters');
  }
  if (name.trim().length > 100) {
    return fail(res, 'Name cannot exceed 100 characters');
  }
  if (!NAME_REGEX.test(name.trim())) {
    return fail(res, 'Name can only contain letters, spaces, hyphens and apostrophes');
  }

  if (!email || !email.trim()) {
    return fail(res, 'Email is required');
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return fail(res, 'Please provide a valid email address');
  }

  if (!password) {
    return fail(res, 'Password is required');
  }
  if (password.length < 6) {
    return fail(res, 'Password must be at least 6 characters');
  }
  if (password.length > 128) {
    return fail(res, 'Password cannot exceed 128 characters');
  }

  // Sanitize before passing to controller
  req.body.name  = name.trim();
  req.body.email = email.trim().toLowerCase();

  next();
};

/**
 * Validate POST /api/auth/login
 * Required: email, password
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !email.trim()) {
    return fail(res, 'Email is required');
  }
  if (!EMAIL_REGEX.test(email.trim())) {
    return fail(res, 'Please provide a valid email address');
  }

  if (!password) {
    return fail(res, 'Password is required');
  }

  req.body.email = email.trim().toLowerCase();

  next();
};

/**
 * Validate PUT /api/auth/change-password
 * Required: currentPassword, newPassword
 */
const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword) {
    return fail(res, 'Current password is required');
  }
  if (!newPassword) {
    return fail(res, 'New password is required');
  }
  if (newPassword.length < 6) {
    return fail(res, 'New password must be at least 6 characters');
  }
  if (newPassword.length > 128) {
    return fail(res, 'New password cannot exceed 128 characters');
  }
  if (currentPassword === newPassword) {
    return fail(res, 'New password must be different from the current password');
  }

  next();
};

module.exports = { validateRegister, validateLogin, validateChangePassword };
