const User    = require('../models/User');
const Trip    = require('../models/Trip');
const Review  = require('../models/Review');
const Report  = require('../models/Report');
const Profile = require('../models/Profile');
const Message = require('../models/Message');

// ─── Dashboard ────────────────────────────────────────────

/**
 * @desc  Admin dashboard stats
 * @route GET /api/admin/stats
 * @access Admin
 */
const getStats = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const sevenDaysAgo  = new Date(Date.now() -  7 * 86400000);

    const [
      totalUsers, activeUsers, inactiveUsers, newUsers, newUsersThisWeek,
      totalTrips, activeTrips, completedTrips,
      pendingReports, totalReports, resolvedReports,
      totalReviews, avgRatingResult,
      totalMessages,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Trip.countDocuments(),
      Trip.countDocuments({ status: { $in: ['upcoming', 'ongoing'] } }),
      Trip.countDocuments({ status: 'completed' }),
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments(),
      Report.countDocuments({ status: { $in: ['resolved', 'dismissed'] } }),
      Review.countDocuments({ isVisible: true }),
      Review.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]),
      Message.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        users:    { total: totalUsers, active: activeUsers, inactive: inactiveUsers, newThisMonth: newUsers, newThisWeek: newUsersThisWeek },
        trips:    { total: totalTrips, active: activeTrips, completed: completedTrips },
        reports:  { total: totalReports, pending: pendingReports, resolved: resolvedReports },
        reviews:  { total: totalReviews, averageRating: avgRatingResult[0] ? Math.round(avgRatingResult[0].avg * 10) / 10 : 0 },
        messages: { total: totalMessages },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── User Management ──────────────────────────────────────

/**
 * @desc  Get all users (paginated, searchable)
 * @route GET /api/admin/users
 * @access Admin
 * @query search, status (active|inactive), role, sort, page, limit
 */
const getUsers = async (req, res, next) => {
  try {
    const {
      search, status, role,
      sort = 'newest',
      page = 1, limit = 15,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (status === 'active')   query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (role)                  query.role     = role;

    const sortMap = {
      newest: { createdAt: -1 },
      oldest: { createdAt:  1 },
      name:   { name:       1 },
    };
    const sortQuery = sortMap[sort] || { createdAt: -1 };

    const pageNum  = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query).sort(sortQuery).skip(skip).limit(limitNum),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: users,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Get a single user by ID (admin view)
 * @route GET /api/admin/users/:id
 * @access Admin
 */
const getUserById = async (req, res, next) => {
  try {
    const user    = await User.findById(req.params.id);
    const profile = await Profile.findOne({ user: req.params.id });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: { user, profile } });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Toggle user active/inactive status (block / unblock)
 * @route PUT /api/admin/users/:id/toggle-status
 * @access Admin
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot block an admin account' });
    }

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'unblocked' : 'blocked'} successfully`,
      data: { _id: user._id, isActive: user.isActive },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Delete a user account (admin only)
 * @route DELETE /api/admin/users/:id
 * @access Admin
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot delete an admin account' });
    }

    // Clean up the user's profile
    await Profile.deleteOne({ user: user._id });
    await user.deleteOne();

    res.status(200).json({ success: true, message: 'User and profile deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// ─── Report Management ────────────────────────────────────

/**
 * @desc  Get all reports (paginated, filterable by status)
 * @route GET /api/admin/reports
 * @access Admin
 * @query status, page, limit
 */
const getReports = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 15 } = req.query;

    const query = {};
    if (status && status !== 'all') query.status = status;

    const pageNum  = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate('reportedBy',   'name email avatar')
        .populate('reportedUser', 'name email avatar')
        .populate('resolvedBy',   'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Report.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: reports.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: reports,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Update report status (reviewed / resolved / dismissed)
 * @route PUT /api/admin/reports/:id
 * @access Admin
 * @body  { status, adminNote? }
 */
const updateReportStatus = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const updates = { status };
    if (adminNote !== undefined) updates.adminNote = adminNote.trim();
    if (status === 'resolved' || status === 'dismissed') {
      updates.resolvedBy = req.user._id;
      updates.resolvedAt = new Date();
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    )
      .populate('reportedBy',   'name email avatar')
      .populate('reportedUser', 'name email avatar');

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // If resolved: mark the reported user as flagged
    if (status === 'resolved') {
      await User.findByIdAndUpdate(report.reportedUser._id, { isReported: true });
    }

    res.status(200).json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

// ─── Review/Feedback Management ───────────────────────────

/**
 * @desc  Get all reviews (admin view, including hidden)
 * @route GET /api/admin/reviews
 * @access Admin
 * @query rating, isVisible, page, limit
 */
const getReviews = async (req, res, next) => {
  try {
    const { rating, isVisible, page = 1, limit = 15 } = req.query;

    const query = {};
    if (rating)    query.rating    = Number(rating);
    if (isVisible !== undefined && isVisible !== '') {
      query.isVisible = isVisible === 'true';
    }

    const pageNum  = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('reviewer', 'name avatar email')
        .populate('reviewee', 'name avatar email')
        .populate('trip',     'title destination')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Review.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: reviews,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Toggle review visibility
 * @route PUT /api/admin/reviews/:id
 * @access Admin
 * @body  { isVisible }
 */
const updateReviewVisibility = async (req, res, next) => {
  try {
    const { isVisible } = req.body;

    if (typeof isVisible !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isVisible must be a boolean' });
    }

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $set: { isVisible } },
      { new: true }
    )
      .populate('reviewer', 'name avatar')
      .populate('reviewee', 'name avatar');

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Recalculate reputation score when visibility changes
    await Review.updateReputationScore(review.reviewee._id);

    res.status(200).json({ success: true, data: review });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Submit a report against another user (any authenticated user)
 * @route POST /api/admin/reports
 * @access Private (not admin-only)
 * @body  { reportedUserId, reason, description }
 */
const submitReport = async (req, res, next) => {
  try {
    const { reportedUserId, reason, description } = req.body;
    const reportedBy = req.user._id;

    if (!reportedUserId) return res.status(400).json({ success: false, message: 'reportedUserId is required' });
    if (reportedUserId === reportedBy.toString()) return res.status(400).json({ success: false, message: 'Cannot report yourself' });

    const validReasons = ['harassment', 'fake_profile', 'spam', 'inappropriate_content', 'scam', 'other'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ success: false, message: `Reason must be one of: ${validReasons.join(', ')}` });
    }

    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) return res.status(404).json({ success: false, message: 'User not found' });

    // Prevent duplicate pending reports from same reporter
    const existing = await Report.findOne({ reportedBy, reportedUser: reportedUserId, status: 'pending' });
    if (existing) return res.status(409).json({ success: false, message: 'You already have a pending report for this user' });

    const report = await Report.create({
      reportedBy,
      reportedUser: reportedUserId,
      reason,
      description: description?.trim() || '',
    });

    res.status(201).json({ success: true, data: report, message: 'Report submitted. Our team will review it.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStats,
  getUsers,
  getUserById,
  toggleUserStatus,
  deleteUser,
  getReports,
  updateReportStatus,
  getReviews,
  updateReviewVisibility,
  submitReport,
};
