const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getGroupChatInfo,
  getGroupMessages,
  sendGroupMessage,
} = require('../controllers/groupChatController');

router.use(protect);

// GET  /api/group-chat/:tripId           — trip info + members
router.get('/:tripId',           getGroupChatInfo);
// GET  /api/group-chat/:tripId/messages  — message history
router.get('/:tripId/messages',  getGroupMessages);
// POST /api/group-chat/:tripId/messages  — send a message
router.post('/:tripId/messages', sendGroupMessage);

module.exports = router;
