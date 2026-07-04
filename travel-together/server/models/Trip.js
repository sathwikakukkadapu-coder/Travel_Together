const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    joinedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'accepted',
    },
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Trip title is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      maxlength: 1000,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    destination: {
      city: { type: String, required: true },
      country: { type: String, default: '' },
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    budget: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
    },
    interests: {
      type: [String],
      default: [],
    },
    maxMembers: {
      type: Number,
      default: 5,
      min: 2,
    },
    members: {
      type: [memberSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    coverImage: {
      type: String,
      default: '',
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Virtual: current member count
tripSchema.virtual('memberCount').get(function () {
  return this.members.filter((m) => m.status === 'accepted').length + 1; // +1 for creator
});

tripSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Trip', tripSchema);
