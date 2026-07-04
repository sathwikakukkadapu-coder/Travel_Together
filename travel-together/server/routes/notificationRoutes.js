const express = require('express');
const router  = express.Router();

const { protect } = require('../middleware/authMiddleware');
const {
  getNotifications,
  getUnreadCount,
  markOneRead,
  markAllRead,
  deleteOne,
  deleteAllRead,
} = require('../controllers/notificationController');

router.use(protect);

router.get('/',              getNotifications);
router.get('/unread-count',  getUnreadCount);
router.put('/read-all',      markAllRead);
router.delete('/read',       deleteAllRead);
router.put('/:id/read',      markOneRead);
router.delete('/:id',        deleteOne);

module.exports = router;
