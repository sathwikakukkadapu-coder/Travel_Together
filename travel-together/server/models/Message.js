const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    // Conversation is identified by a sorted pair of user IDs
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content cannot be empty'],
      maxlength: 1000,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Helper: generate a consistent conversationId from two user IDs
messageSchema.statics.getConversationId = function (userId1, userId2) {
  return [userId1.toString(), userId2.toString()].sort().join('_');
};

module.exports = mongoose.model('Message', messageSchema);
