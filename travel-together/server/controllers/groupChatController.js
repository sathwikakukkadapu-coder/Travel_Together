const Trip         = require('../models/Trip');
const GroupMessage = require('../models/GroupMessage');
const Notification = require('../models/Notification');

/**
 * Helper: check if the requesting user is a member or creator of the trip.
 */
const isTripMember = (trip, userId) => {
  const uid = userId.toString();
  if (trip.createdBy.toString() === uid) return true;
  return trip.members.some(
    (m) => m.user.toString() === uid && m.status === 'accepted'
  );
};

/**
 * @desc   Get all messages for a trip's group chat
 * @route  GET /api/group-chat/:tripId/messages
 * @access Private — trip members only
 */
const getGroupMessages = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    if (!isTripMember(trip, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied. Join the trip to view group chat.' });
    }

    const page  = Math.max(1, Number(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const skip  = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      GroupMessage.find({ trip: req.params.tripId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sender', 'name avatar'),
      GroupMessage.countDocuments({ trip: req.params.tripId }),
    ]);

    res.status(200).json({
      success: true,
      count: messages.length,
      total,
      page,
      data: messages.reverse(), // oldest first for display
      trip: {
        _id:         trip._id,
        title:       trip.title,
        destination: trip.destination,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc   Send a message to a trip's group chat
 * @route  POST /api/group-chat/:tripId/messages
 * @access Private — trip members only
 */
const sendGroupMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const trip = await Trip.findById(req.params.tripId)
      .populate('createdBy', '_id name')
      .populate('members.user', '_id name');

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    if (!isTripMember(trip, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied. Join the trip to send messages.' });
    }

    const message = await GroupMessage.create({
      trip:    trip._id,
      sender:  req.user._id,
      content: content.trim(),
    });
    await message.populate('sender', 'name avatar');

    // Emit via socket to trip room
    const { getIO, emitToUser } = require('../socket');
    const io = getIO();
    if (io) {
      io.to(`trip:${trip._id}`).emit('groupChat:message', message.toObject());

      // Notify other members (not the sender)
      const allMemberIds = [
        trip.createdBy._id.toString(),
        ...trip.members
          .filter((m) => m.status === 'accepted')
          .map((m) => m.user._id.toString()),
      ].filter((id) => id !== req.user._id.toString());

      const uniqueIds = [...new Set(allMemberIds)];
      for (const memberId of uniqueIds) {
        const notif = await Notification.create({
          recipient: memberId,
          sender:    req.user._id,
          type:      'trip_update',
          title:     `New message in ${trip.title}`,
          message:   `${req.user.name}: ${content.trim().slice(0, 80)}${content.length > 80 ? '…' : ''}`,
          refModel:  'Trip',
          refId:     trip._id,
        });
        emitToUser(io, memberId, 'notification:new', notif.toObject());
      }
    }

    res.status(201).json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc   Get trip info + member list for the group chat header
 * @route  GET /api/group-chat/:tripId
 * @access Private — trip members only
 */
const getGroupChatInfo = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.tripId)
      .populate('createdBy', 'name avatar')
      .populate('members.user', 'name avatar');

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    if (!isTripMember(trip, req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied. Join the trip first.' });
    }

    res.status(200).json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
};

module.exports = { getGroupMessages, sendGroupMessage, getGroupChatInfo };
