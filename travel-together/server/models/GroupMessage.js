const mongoose = require('mongoose');

/**
 * GroupMessage — stores chat messages for a specific trip.
 * All trip members + creator can read/write.
 */
const groupMessageSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content cannot be empty'],
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

// Compound index for efficient per-trip message queries
groupMessageSchema.index({ trip: 1, createdAt: 1 });

module.exports = mongoose.model('GroupMessage', groupMessageSchema);
