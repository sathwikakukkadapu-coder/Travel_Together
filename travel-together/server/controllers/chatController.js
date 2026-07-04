const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// ─── helpers ─────────────────────────────────────────────────────────────────

/**
 * Build the sorted conversationId used to key every message
 * between two users without needing a separate Conversation collection.
 */
const getConvId = (a, b) => Message.getConversationId(a, b);

// ─── controllers ─────────────────────────────────────────────────────────────

/**
 * @desc    Get all conversations (inbox) for the logged-in user
 *          Returns the latest message per conversation + unread count
 * @route   GET /api/chat/conversations
 * @access  Private
 */
const getConversations = async (req, res, next) => {
  try {
    // Cast to ObjectId explicitly — aggregation pipeline does NOT auto-cast
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiver', userId] }, { $eq: ['$isRead', false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);

    // Populate the other participant's user info
    const populated = await Promise.all(
      conversations.map(async (conv) => {
        const msg = conv.lastMessage;
        const otherUserId = msg.sender.toString() === userId.toString()
          ? msg.receiver
          : msg.sender;

        const otherUser = await User.findById(otherUserId).select('name email avatar');

        return {
          conversationId: conv._id,
          participant: otherUser,
          lastMessage: {
            content: msg.content,
            sender: msg.sender,
            createdAt: msg.createdAt,
            isRead: msg.isRead,
          },
          unreadCount: conv.unreadCount,
        };
      })
    );

    res.status(200).json({ success: true, count: populated.length, data: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get full message history between logged-in user and another user
 * @route   GET /api/chat/:userId
 * @access  Private
 * @query   page, limit
 */
const getMessages = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    if (userId === myId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot chat with yourself' });
    }

    // Verify the other user exists
    const otherUser = await User.findById(userId).select('name email avatar');
    if (!otherUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const page  = Math.max(1, Number(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const skip  = (page - 1) * limit;

    const conversationId = getConvId(myId, userId);

    const [messages, total] = await Promise.all([
      Message.find({ conversationId })
        .sort({ createdAt: -1 })   // newest first; client reverses for display
        .skip(skip)
        .limit(limit)
        .populate('sender', 'name avatar')
        .populate('receiver', 'name avatar'),
      Message.countDocuments({ conversationId }),
    ]);

    // Mark all unread messages sent to the current user as read
    await Message.updateMany(
      { conversationId, receiver: myId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      count: messages.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      participant: otherUser,
      data: messages.reverse(), // oldest-first for chat display
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send a message to another user
 * @route   POST /api/chat/:userId
 * @access  Private
 */
const sendMessage = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const senderId   = req.user._id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    if (userId === senderId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot send a message to yourself' });
    }

    const receiver = await User.findById(userId).select('name');
    if (!receiver) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    const conversationId = getConvId(senderId, userId);

    const message = await Message.create({
      conversationId,
      sender: senderId,
      receiver: userId,
      content: content.trim(),
    });

    await message.populate('sender', 'name avatar');
    await message.populate('receiver', 'name avatar');

    // Create a notification for the recipient
    await Notification.create({
      recipient: userId,
      sender: senderId,
      type: 'new_message',
      title: 'New Message',
      message: `${req.user.name} sent you a message`,
      refModel: 'Message',
      refId: message._id,
    });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a message (only the sender can delete their own message)
 * @route   DELETE /api/chat/message/:messageId
 * @access  Private
 */
const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this message' });
    }

    await message.deleteOne();

    res.status(200).json({ success: true, message: 'Message deleted' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get unread message count across all conversations
 * @route   GET /api/chat/unread-count
 * @access  Private
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      isRead: false,
    });

    res.status(200).json({ success: true, unreadCount: count });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all messages in a conversation as read
 * @route   PUT /api/chat/:userId/read
 * @access  Private
 */
const markConversationRead = async (req, res, next) => {
  try {
    const conversationId = getConvId(req.user._id, req.params.userId);

    const result = await Message.updateMany(
      { conversationId, receiver: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      success: true,
      markedRead: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  deleteMessage,
  getUnreadCount,
  markConversationRead,
};
