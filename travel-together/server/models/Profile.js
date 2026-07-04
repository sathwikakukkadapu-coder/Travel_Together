const mongoose = require('mongoose');

const travelHistorySchema = new mongoose.Schema(
  {
    destination: { type: String, required: true },
    visitedOn: { type: Date },
    description: { type: String, default: '' },
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    age: {
      type: Number,
      min: 18,
      max: 100,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'non-binary', 'prefer not to say'],
    },
    phone: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      maxlength: 500,
      default: '',
    },
    location: {
      city: { type: String, default: '' },
      country: { type: String, default: '' },
    },
    // Travel preferences used in matching
    travelInterests: {
      type: [String],
      enum: [
        'adventure',
        'beach',
        'culture',
        'food',
        'history',
        'nature',
        'nightlife',
        'photography',
        'shopping',
        'spiritual',
        'sports',
        'wildlife',
      ],
      default: [],
    },
    preferredDestinations: {
      type: [String],
      default: [],
    },
    budgetRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
    },
    travelStyle: {
      type: String,
      enum: ['budget', 'mid-range', 'luxury', 'backpacker'],
      default: 'mid-range',
    },
    languages: {
      type: [String],
      default: [],
    },
    travelHistory: {
      type: [travelHistorySchema],
      default: [],
    },
    // Reputation score derived from reviews
    reputationScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', profileSchema);
