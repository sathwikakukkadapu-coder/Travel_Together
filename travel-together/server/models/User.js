const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never returned in queries by default
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: {
        values: ['traveler', 'admin'],
        message: 'Role must be traveler or admin',
      },
      default: 'traveler',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isReported: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    // Strip sensitive fields from any JSON output
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Hooks ────────────────────────────────────────────────

// Hash password before save/update
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Instance Methods ─────────────────────────────────────

// Compare plain text password against stored hash
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ─── Static Methods ───────────────────────────────────────

// Find active user by email, optionally include password
userSchema.statics.findByEmail = function (email, includePassword = false) {
  const query = this.findOne({ email: email.toLowerCase() });
  return includePassword ? query.select('+password') : query;
};

module.exports = mongoose.model('User', userSchema);
