const Notification = require('../models/Notification');

/**
 * @desc  Get all notifications for the logged-in user (paginated)
 * @route GET /api/notifications
 * @access Private
 * @query unreadOnly, type, page, limit
 */
const getNotifications = async (req, res, next) => {
  try {
    const { unreadOnly, type, page = 1, limit = 20 } = req.query;

    const query = { recipient: req.user._id };

    if (unreadOnly === 'true') query.isRead = false;
    if (type)                  query.type   = type;

    const pageNum  = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate('sender', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      unreadCount,
      data: notifications,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Get count of unread notifications
 * @route GET /api/notifications/unread-count
 * @access Private
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead:    false,
    });

    res.status(200).json({ success: true, count });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Mark a single notification as read
 * @route PUT /api/notifications/:id/read
 * @access Private
 */
const markOneRead = async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, data: notif });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Mark all notifications as read for the logged-in user
 * @route PUT /api/notifications/read-all
 * @access Private
 */
const markAllRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({ success: true, markedRead: result.modifiedCount });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Delete a single notification
 * @route DELETE /api/notifications/:id
 * @access Private
 */
const deleteOne = async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndDelete({
      _id:       req.params.id,
      recipient: req.user._id,
    });

    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Delete all read notifications for the logged-in user
 * @route DELETE /api/notifications/read
 * @access Private
 */
const deleteAllRead = async (req, res, next) => {
  try {
    const result = await Notification.deleteMany({
      recipient: req.user._id,
      isRead:    true,
    });

    res.status(200).json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markOneRead,
  markAllRead,
  deleteOne,
  deleteAllRead,
};
