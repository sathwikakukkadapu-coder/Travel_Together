const { Server } = require('socket.io');
const jwt        = require('jsonwebtoken');
const User       = require('../models/User');
const Message    = require('../models/Message');
const Notification = require('../models/Notification');

// ── Singleton IO reference (so controllers can emit) ─────────────────────────
let _io = null;
const getIO = () => _io;

// ── Online-user tracking: userId → Set<socketId> ─────────────────────────────
const onlineUsers = new Map();

const setOnline = (userId, socketId) => {
  const uid = userId.toString();
  if (!onlineUsers.has(uid)) onlineUsers.set(uid, new Set());
  const wasOffline = onlineUsers.get(uid).size === 0;
  onlineUsers.get(uid).add(socketId);
  return wasOffline;
};

const setOffline = (userId, socketId) => {
  const uid = userId.toString();
  if (!onlineUsers.has(uid)) return false;
  onlineUsers.get(uid).delete(socketId);
  if (onlineUsers.get(uid).size === 0) { onlineUsers.delete(uid); return true; }
  return false;
};

const isOnline = (userId) => onlineUsers.has(userId.toString());

/** Emit to every socket tab a user has open */
const emitToUser = (io, userId, event, data) => {
  const sockets = onlineUsers.get(userId.toString());
  if (!sockets) return;
  for (const sid of sockets) io.to(sid).emit(event, data);
};

// ── Init ──────────────────────────────────────────────────────────────────────
const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin:      process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
    pingTimeout: 60000,
  });

  _io = io; // store singleton

  // ── JWT auth middleware ────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication token missing'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id name avatar');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  // ── Connection ─────────────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.user._id;

    if (setOnline(userId, socket.id)) {
      socket.broadcast.emit('user:online', { userId: userId.toString() });
    }

    // Check online status for a list of user IDs
    socket.on('users:status', (userIds, cb) => {
      if (typeof cb !== 'function') return;
      const result = {};
      userIds.forEach((id) => { result[id] = isOnline(id); });
      cb(result);
    });

    // Join / leave conversation rooms
    socket.on('conversation:join', (otherUserId) => {
      socket.join(Message.getConversationId(userId, otherUserId));
    });
    socket.on('conversation:leave', (otherUserId) => {
      socket.leave(Message.getConversationId(userId, otherUserId));
    });

    // Join / leave trip group chat rooms
    socket.on('tripChat:join', (tripId) => {
      socket.join(`trip:${tripId}`);
    });
    socket.on('tripChat:leave', (tripId) => {
      socket.leave(`trip:${tripId}`);
    });

    // ── Send message ───────────────────────────────────────────────────────
    socket.on('message:send', async ({ receiverId, content }, cb) => {
      try {
        if (!content?.trim()) return cb?.({ success: false, error: 'Content required' });
        if (receiverId === userId.toString()) return cb?.({ success: false, error: 'Cannot message yourself' });

        const receiver = await User.findById(receiverId).select('_id name');
        if (!receiver) return cb?.({ success: false, error: 'Recipient not found' });

        const conversationId = Message.getConversationId(userId, receiverId);

        const message = await Message.create({
          conversationId, sender: userId, receiver: receiverId, content: content.trim(),
        });
        await message.populate('sender', 'name avatar');
        await message.populate('receiver', 'name avatar');
        const msgPayload = message.toObject();

        // Deliver to room + direct to receiver sockets
        io.to(conversationId).emit('message:new', msgPayload);
        emitToUser(io, receiverId, 'message:new', msgPayload);

        // Notification
        const notif = await Notification.create({
          recipient: receiverId,
          sender:    userId,
          type:      'new_message',
          title:     'New Message',
          message:   `${socket.user.name} sent you a message`,
          refModel:  'Message',
          refId:     message._id,
        });
        emitToUser(io, receiverId, 'notification:new', notif.toObject());

        cb?.({ success: true, data: msgPayload });
      } catch (err) {
        console.error('[socket] message:send error:', err.message);
        cb?.({ success: false, error: 'Server error' });
      }
    });

    // ── Typing indicators ──────────────────────────────────────────────────
    socket.on('typing:start', ({ receiverId }) => {
      const room = Message.getConversationId(userId, receiverId);
      socket.to(room).emit('typing:start', { userId: userId.toString() });
      emitToUser(io, receiverId, 'typing:start', { userId: userId.toString() });
    });
    socket.on('typing:stop', ({ receiverId }) => {
      const room = Message.getConversationId(userId, receiverId);
      socket.to(room).emit('typing:stop', { userId: userId.toString() });
      emitToUser(io, receiverId, 'typing:stop', { userId: userId.toString() });
    });

    // ── Mark messages read ─────────────────────────────────────────────────
    socket.on('messages:read', async ({ senderId }) => {
      try {
        const conversationId = Message.getConversationId(userId, senderId);
        await Message.updateMany(
          { conversationId, receiver: userId, isRead: false },
          { isRead: true, readAt: new Date() }
        );
        emitToUser(io, senderId, 'messages:read', {
          conversationId,
          readBy: userId.toString(),
        });
      } catch (err) {
        console.error('[socket] messages:read error:', err.message);
      }
    });

    // ── Disconnect ─────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      if (setOffline(userId, socket.id)) {
        socket.broadcast.emit('user:offline', {
          userId: userId.toString(),
          lastSeen: new Date(),
        });
      }
    });
  });

  return io;
};

module.exports = { initSocket, getIO, isOnline, emitToUser };
