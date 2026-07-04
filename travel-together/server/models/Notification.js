const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      required: true,
      enum: [
        'new_match',       // Someone matches your travel preferences
        'new_message',     // Someone sent you a message
        'trip_invite',     // Invited to join a trip / new trip created
        'trip_join',       // Someone joined your trip
        'trip_update',     // Trip details changed / new group message
        'trip_cancelled',  // Trip was cancelled
        'new_review',      // Someone reviewed you
        'report_action',   // Admin took action on a report
      ],
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    message: {
      type: String,
      required: true,
      maxlength: 300,
    },
    // Optional reference to the related document
    refModel: {
      type: String,
      enum: ['Trip', 'Message', 'Review', 'User'],
    },
    refId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
