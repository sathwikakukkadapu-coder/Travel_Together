const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    // User being reviewed
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // User leaving the review
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
      maxlength: 800,
      default: '',
    },
    tags: {
      type: [String],
      enum: [
        'friendly',
        'reliable',
        'punctual',
        'fun',
        'responsible',
        'communicative',
        'respectful',
      ],
      default: [],
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// A reviewer can only review a reviewee once per trip
reviewSchema.index({ reviewer: 1, reviewee: 1, trip: 1 }, { unique: true });

// After saving a review, update profile reputation score
reviewSchema.statics.updateReputationScore = async function (revieweeId) {
  const Profile = mongoose.model('Profile');
  const result = await this.aggregate([
    { $match: { reviewee: revieweeId, isVisible: true } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  if (result.length > 0) {
    await Profile.findOneAndUpdate(
      { user: revieweeId },
      {
        reputationScore: Math.round(result[0].avg * 10) / 10,
        totalRatings: result[0].count,
      }
    );
  }
};

module.exports = mongoose.model('Review', reviewSchema);
