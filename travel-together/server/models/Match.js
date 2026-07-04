const mongoose = require('mongoose');

/**
 * Match Collection
 * Persists a computed match score between two users so repeated
 * GET /api/match calls can read from cache instead of re-running
 * the algorithm. The matching controller creates/updates this
 * document whenever it calculates a fresh score.
 */
const matchSchema = new mongoose.Schema(
  {
    // Always store the pair in sorted order (lower _id first)
    // so (A,B) and (B,A) map to the same document.
    users: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      validate: {
        validator: (arr) => arr.length === 2,
        message: 'A match must have exactly 2 users',
      },
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    breakdown: {
      destination:  { score: Number, weight: String },
      budget:       { score: Number, weight: String },
      interests:    { score: Number, weight: String },
      travelDates:  { score: Number, weight: String },
      styleBonus:   { score: Number, weight: String },
    },
    // Has either user dismissed/hidden the match?
    dismissedBy: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    lastCalculated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Unique pair index — one document per user pair regardless of order
matchSchema.index({ users: 1 }, { unique: true });

module.exports = mongoose.model('Match', matchSchema);
