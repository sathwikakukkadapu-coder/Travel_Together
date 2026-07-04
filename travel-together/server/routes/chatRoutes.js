const express = require('express');
const router = express.Router();
const {
  getConversations,
  getMessages,
  sendMessage,
  deleteMessage,
  getUnreadCount,
  markConversationRead,
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// All chat routes are protected
router.use(protect);

// Inbox & unread badge
router.get('/conversations',          getConversations);    // GET  /api/chat/conversations
router.get('/unread-count',           getUnreadCount);      // GET  /api/chat/unread-count

// Single message actions — must come BEFORE /:userId to avoid param collision
router.delete('/message/:messageId',  deleteMessage);       // DELETE /api/chat/message/:messageId

// Per-conversation actions
router.get('/:userId',                getMessages);         // GET  /api/chat/:userId
router.post('/:userId',               sendMessage);         // POST /api/chat/:userId
router.put('/:userId/read',           markConversationRead);// PUT  /api/chat/:userId/read

module.exports = router;
