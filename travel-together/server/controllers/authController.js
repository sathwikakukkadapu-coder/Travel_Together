const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const Profile = require('../models/Profile');

// ─── Private helpers ──────────────────────────────────────

/**
 * Sign a JWT for the given user _id.
 * Expiry is read from .env (default 7d).
 */
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Build and send the standard auth response.
 * Token + safe user object (no password, no __v).
 */
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id:    user._id,
      name:   user.name,
      email:  user.email,
      avatar: user.avatar,
      role:   user.role,
    },
  });
};

// ─── Controllers ──────────────────────────────────────────

/**
 * @desc    Register a new traveler account
 * @route   POST /api/auth/register
 * @access  Public
 * @body    { name, email, password }
 *
 * Flow:
 *  1. Validation middleware already checked fields (authValidators.validateRegister)
 *  2. Reject duplicate email
 *  3. Create User (password hashed in pre-save hook)
 *  4. Auto-create empty Profile linked to the user
 *  5. Return JWT + user object
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Duplicate email check
    const exists = await User.findByEmail(email);
    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Create user — password hashed by pre-save hook in User model
    const user = await User.create({ name, email, password });

    // Auto-create blank profile so profile page always has a document
    // Optionally seed age + gender from registration if provided
    const profileData = { user: user._id };
    if (req.body.age)    profileData.age    = Number(req.body.age);
    if (req.body.gender) profileData.gender = req.body.gender;
    await Profile.create(profileData);

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login with email and password
 * @route   POST /api/auth/login
 * @access  Public
 * @body    { email, password }
 *
 * Flow:
 *  1. Validation middleware already checked fields (authValidators.validateLogin)
 *  2. Find user by email — include password field explicitly
 *  3. Compare password using bcrypt
 *  4. Block deactivated accounts
 *  5. Update lastLogin timestamp
 *  6. Return JWT + user object
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // findByEmail static — includes password field
    const user = await User.findByEmail(email, true);

    // Generic message prevents email enumeration attacks
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Welcome notification (once per session — only if no notifications in last 24h)
    try {
      const Notification = require('../models/Notification');
      const oneDayAgo = new Date(Date.now() - 86400000);
      const recent = await Notification.findOne({
        recipient: user._id,
        type: 'new_match',
        title: 'Welcome to Travel Together!',
        createdAt: { $gte: oneDayAgo },
      });
      if (!recent) {
        await Notification.create({
          recipient: user._id,
          type:      'new_match',
          title:     'Welcome to Travel Together!',
          message:   'Explore trips and connect with fellow travelers. Find your perfect travel buddy!',
        });
      }
    } catch { /* non-critical */ }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated user + their profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    // req.user already attached by protect middleware
    const profile = await Profile.findOne({ user: req.user._id });

    res.status(200).json({
      success: true,
      user:    req.user,
      profile: profile || null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout — client must discard the JWT
 * @route   POST /api/auth/logout
 * @access  Private
 *
 * JWT is stateless so we cannot invalidate it server-side without
 * a token blacklist (Redis). For this project, logout is client-side only.
 */
const logout = (_req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

/**
 * @desc    Change password for the authenticated user
 * @route   PUT /api/auth/change-password
 * @access  Private
 * @body    { currentPassword, newPassword }
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Re-fetch user with password field (select:false by default)
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    user.password = newPassword; // hashed by pre-save hook
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update display name for the authenticated user
 * @route   PUT /api/auth/me
 * @access  Private
 * @body    { name }
 */
const updateMe = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );
    res.status(200).json({
      success: true,
      user: {
        _id:    user._id,
        name:   user.name,
        email:  user.email,
        avatar: user.avatar,
        role:   user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateMe, logout, changePassword };
