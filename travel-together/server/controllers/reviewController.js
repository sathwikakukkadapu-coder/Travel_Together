const Review       = require('../models/Review');
const Profile      = require('../models/Profile');
const User         = require('../models/User');
const Notification = require('../models/Notification');

/**
 * @desc  Get all reviews written ABOUT a specific user
 * @route GET /api/reviews/user/:userId
 * @access Private
 * @query page, limit
 */
const getReviewsForUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const pageNum    = Math.max(1, Number(req.query.page)  || 1);
    const limitNum   = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const skip       = (pageNum - 1) * limitNum;

    const query = { reviewee: userId, isVisible: true };

    const mongoose = require('mongoose');
    const [reviews, total, aggResult] = await Promise.all([
      Review.find(query)
        .populate('reviewer', 'name avatar')
        .populate('trip', 'title destination')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Review.countDocuments(query),
      Review.aggregate([
        { $match: { reviewee: new mongoose.Types.ObjectId(userId), isVisible: true } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
    ]);

    const averageRating = aggResult[0] ? Math.round(aggResult[0].avg * 10) / 10 : 0;

    // Rating distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => { distribution[r.rating] = (distribution[r.rating] || 0) + 1; });

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      averageRating,
      distribution,
      data: reviews,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Get all reviews written ABOUT the logged-in user
 * @route GET /api/reviews/me
 * @access Private
 */
const getMyReviews = async (req, res, next) => {
  try {
    const pageNum  = Math.max(1, Number(req.query.page)  || 1);
    const limitNum = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const skip     = (pageNum - 1) * limitNum;

    const query = { reviewee: req.user._id, isVisible: true };

    const [reviews, total, aggResult, profile] = await Promise.all([
      Review.find(query)
        .populate('reviewer', 'name avatar')
        .populate('reviewee', 'name avatar')
        .populate('trip', 'title destination')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Review.countDocuments(query),
      Review.aggregate([
        { $match: { reviewee: req.user._id, isVisible: true } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
      Profile.findOne({ user: req.user._id }).select('reputationScore totalRatings'),
    ]);

    const averageRating = aggResult[0] ? Math.round(aggResult[0].avg * 10) / 10 : 0;

    // Tag frequency across all reviews
    const allReviews = await Review.find({ reviewee: req.user._id, isVisible: true }).select('tags');
    const tagFreq = {};
    allReviews.forEach((r) => r.tags.forEach((t) => { tagFreq[t] = (tagFreq[t] || 0) + 1; }));

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      averageRating,
      reputationScore: profile?.reputationScore || 0,
      totalRatings:    profile?.totalRatings    || 0,
      tagFrequency:    tagFreq,
      data: reviews,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Get all reviews written BY the logged-in user (reviews I gave)
 * @route GET /api/reviews/given
 * @access Private
 */
const getReviewsGiven = async (req, res, next) => {
  try {
    const pageNum  = Math.max(1, Number(req.query.page)  || 1);
    const limitNum = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const skip     = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      Review.find({ reviewer: req.user._id })
        .populate('reviewee', 'name avatar')
        .populate('trip', 'title destination')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Review.countDocuments({ reviewer: req.user._id }),
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
 * @desc  Create a review for another user
 * @route POST /api/reviews
 * @access Private
 * @body  { revieweeId, rating, feedback, tags?, tripId? }
 */
const createReview = async (req, res, next) => {
  try {
    const { revieweeId, rating, feedback, tags, tripId } = req.body;
    const reviewerId = req.user._id;

    if (!revieweeId) {
      return res.status(400).json({ success: false, message: 'revieweeId is required' });
    }
    if (revieweeId === reviewerId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot review yourself' });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }
    if (!feedback?.trim()) {
      return res.status(400).json({ success: false, message: 'Feedback is required' });
    }

    const review = await Review.create({
      reviewer: reviewerId,
      reviewee: revieweeId,
      rating:   Number(rating),
      feedback: feedback.trim(),
      tags:     tags || [],
      trip:     tripId || undefined,
    });

    // Update the reviewee's reputation score
    await Review.updateReputationScore(review.reviewee);

    // Notify the reviewee
    await Notification.create({
      recipient: revieweeId,
      sender:    reviewerId,
      type:      'new_review',
      title:     'New Review',
      message:   `${req.user.name} left you a ${rating}-star review`,
      refModel:  'Review',
      refId:     review._id,
    });

    // Real-time socket notification
    const { emitToUser, getIO } = require('../socket');
    const io = getIO();
    if (io) {
      const notif = await Notification.findOne({ refId: review._id, type: 'new_review' })
        .populate('sender', 'name avatar');
      if (notif) emitToUser(io, revieweeId, 'notification:new', notif.toObject());
    }

    await review.populate('reviewer', 'name avatar');
    await review.populate('reviewee', 'name avatar');

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    // Unique index violation — duplicate review
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this user for this trip',
      });
    }
    next(err);
  }
};

/**
 * @desc  Delete own review
 * @route DELETE /api/reviews/:id
 * @access Private
 */
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    if (review.reviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
    }

    const revieweeId = review.reviewee;
    await review.deleteOne();

    // Recalculate reputation after deletion
    await Review.updateReputationScore(revieweeId);

    res.status(200).json({ success: true, message: 'Review deleted' });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Search users by name/email for the review form autocomplete
 * @route GET /api/reviews/search-users?q=name
 * @access Private
 */
const searchUsers = async (req, res, next) => {
  try {
    const q = req.query.q?.trim();
    if (!q || q.length < 2) {
      return res.status(200).json({ success: true, data: [] });
    }
    const users = await User.find({
      _id:      { $ne: req.user._id },
      isActive: true,
      $or: [
        { name:  { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ],
    }).select('name email avatar').limit(8);

    res.status(200).json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getReviewsForUser,
  getMyReviews,
  getReviewsGiven,
  createReview,
  deleteReview,
  searchUsers,
};
