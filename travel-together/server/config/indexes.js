/**
 * indexes.js
 * Run once after connecting to MongoDB to ensure all recommended
 * indexes exist. Safe to call on every startup — createIndex is idempotent.
 *
 * Usage in server.js:
 *   const ensureIndexes = require('./config/indexes');
 *   connectDB().then(ensureIndexes);
 */

const mongoose = require('mongoose');

const ensureIndexes = async () => {
  const db = mongoose.connection.db;

  // ── users ────────────────────────────────────────────────────────────────
  await db.collection('users').createIndexes([
    { key: { email: 1 },      name: 'email_unique',    unique: true },
    { key: { role: 1 },       name: 'role' },
    { key: { isActive: 1 },   name: 'isActive' },
    { key: { createdAt: -1 }, name: 'createdAt_desc' },
  ]);

  // ── profiles ─────────────────────────────────────────────────────────────
  await db.collection('profiles').createIndexes([
    { key: { user: 1 },                        name: 'user_unique', unique: true },
    { key: { travelInterests: 1 },             name: 'travelInterests' },
    { key: { preferredDestinations: 1 },       name: 'preferredDestinations' },
    { key: { 'budgetRange.min': 1, 'budgetRange.max': 1 }, name: 'budgetRange' },
    { key: { travelStyle: 1 },                 name: 'travelStyle' },
    { key: { reputationScore: -1 },            name: 'reputationScore_desc' },
  ]);

  // ── trips ─────────────────────────────────────────────────────────────────
  await db.collection('trips').createIndexes([
    { key: { createdBy: 1 },                   name: 'createdBy' },
    { key: { status: 1 },                      name: 'status' },
    { key: { 'destination.city': 1 },          name: 'destination_city' },
    { key: { startDate: 1, endDate: 1 },       name: 'dateRange' },
    { key: { isPublic: 1, status: 1 },         name: 'public_status' },
    { key: { 'members.user': 1 },              name: 'members_user' },
    { key: { interests: 1 },                   name: 'interests' },
  ]);

  // ── matches ───────────────────────────────────────────────────────────────
  await db.collection('matches').createIndexes([
    { key: { users: 1 },          name: 'users_unique', unique: true },
    { key: { score: -1 },         name: 'score_desc' },
    { key: { lastCalculated: -1 },name: 'lastCalculated_desc' },
  ]);

  // ── messages ──────────────────────────────────────────────────────────────
  await db.collection('messages').createIndexes([
    { key: { conversationId: 1, createdAt: -1 }, name: 'conv_time' },
    { key: { sender: 1 },                        name: 'sender' },
    { key: { receiver: 1, isRead: 1 },           name: 'receiver_unread' },
  ]);

  // ── notifications ─────────────────────────────────────────────────────────
  await db.collection('notifications').createIndexes([
    { key: { recipient: 1, isRead: 1, createdAt: -1 }, name: 'recipient_read_time' },
    { key: { recipient: 1, type: 1 },                  name: 'recipient_type' },
  ]);

  // ── reviews ───────────────────────────────────────────────────────────────
  await db.collection('reviews').createIndexes([
    //{ key: { reviewer: 1, reviewee: 1, trip: 1 }, name: 'review_unique', unique: true },
    { key: { reviewee: 1, isVisible: 1 },          name: 'reviewee_visible' },
    { key: { rating: -1 },                         name: 'rating_desc' },
  ]);

  // ── reports ───────────────────────────────────────────────────────────────
  await db.collection('reports').createIndexes([
    { key: { status: 1, createdAt: -1 }, name: 'status_time' },
    { key: { reportedUser: 1 },          name: 'reportedUser' },
    { key: { reportedBy: 1 },            name: 'reportedBy' },
  ]);

  console.log('✓ MongoDB indexes verified');
};

module.exports = ensureIndexes;
