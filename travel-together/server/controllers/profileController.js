const Profile = require('../models/Profile');
const User    = require('../models/User');

// ─── Controllers ──────────────────────────────────────────

/**
 * @desc    Get the logged-in user's own profile
 * @route   GET /api/profile/me
 * @access  Private
 */
const getMyProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id }).populate(
      'user',
      'name email avatar createdAt'
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update the logged-in user's profile
 * @route   PUT /api/profile/me
 * @access  Private
 * @body    Any subset of profile fields (all optional)
 */
const updateMyProfile = async (req, res, next) => {
  try {
    // Whitelist updatable fields — prevents mass-assignment of
    // system fields like reputationScore, totalRatings, user ref
    const allowed = [
      'age', 'gender', 'phone', 'bio', 'location',
      'travelInterests', 'preferredDestinations',
      'budgetRange', 'travelStyle', 'languages',
    ];

    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided to update' });
    }

    // Apply updates
    const profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update avatar URL on the User document
 * @route   PUT /api/profile/me/avatar
 * @access  Private
 * @body    { avatar: String }
 */
const updateAvatar = async (req, res, next) => {
  try {
    const { avatar } = req.body;

    if (!avatar || !avatar.trim()) {
      return res.status(400).json({ success: false, message: 'Avatar URL is required' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatar.trim() },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: { avatar: user.avatar },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get any public user's profile by userId
 * @route   GET /api/profile/:userId
 * @access  Private
 */
const getProfileById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const profile = await Profile.findOne({ user: userId }).populate(
      'user',
      'name email avatar createdAt'
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    // Strip sensitive fields for public view
    const publicProfile = {
      _id:                   profile._id,
      user:                  profile.user,
      age:                   profile.age,
      gender:                profile.gender,
      bio:                   profile.bio,
      location:              profile.location,
      travelInterests:       profile.travelInterests,
      preferredDestinations: profile.preferredDestinations,
      budgetRange:           profile.budgetRange,
      travelStyle:           profile.travelStyle,
      languages:             profile.languages,
      travelHistory:         profile.travelHistory,
      reputationScore:       profile.reputationScore,
      totalRatings:          profile.totalRatings,
    };

    res.status(200).json({ success: true, data: publicProfile });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a travel history entry
 * @route   POST /api/profile/me/travel-history
 * @access  Private
 * @body    { destination, visitedOn?, description? }
 */
const addTravelHistory = async (req, res, next) => {
  try {
    const { destination, visitedOn, description } = req.body;

    const entry = { destination };
    if (visitedOn)   entry.visitedOn   = new Date(visitedOn);
    if (description) entry.description = description.trim();

    const profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      { $push: { travelHistory: entry } },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.status(201).json({
      success: true,
      data: profile.travelHistory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a travel history entry by its index
 * @route   DELETE /api/profile/me/travel-history/:index
 * @access  Private
 */
const deleteTravelHistory = async (req, res, next) => {
  try {
    const index = parseInt(req.params.index, 10);

    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    if (isNaN(index) || index < 0 || index >= profile.travelHistory.length) {
      return res.status(400).json({ success: false, message: 'Invalid travel history index' });
    }

    profile.travelHistory.splice(index, 1);
    await profile.save();

    res.status(200).json({ success: true, data: profile.travelHistory });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get profile completion status and missing fields
 * @route   GET /api/profile/me/completion
 * @access  Private
 */
const getProfileCompletion = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const checks = {
      age:                   !!profile.age,
      gender:                !!profile.gender,
      bio:                   !!profile.bio,
      location:              !!(profile.location?.city && profile.location?.country),
      travelInterests:       profile.travelInterests?.length > 0,
      preferredDestinations: profile.preferredDestinations?.length > 0,
      budgetRange:           profile.budgetRange?.max > 0,
      travelStyle:           !!profile.travelStyle,
      languages:             profile.languages?.length > 0,
    };

    const completed = Object.values(checks).filter(Boolean).length;
    const total     = Object.keys(checks).length;
    const percent   = Math.round((completed / total) * 100);

    const missing = Object.entries(checks)
      .filter(([, done]) => !done)
      .map(([field]) => field);

    res.status(200).json({
      success: true,
      data: {
        percent,
        completed,
        total,
        missing,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  updateAvatar,
  getProfileById,
  addTravelHistory,
  deleteTravelHistory,
  getProfileCompletion,
};
