const Profile      = require('../models/Profile');
const User         = require('../models/User');
const Notification = require('../models/Notification');
const { rankMatches, calculateMatchScore } = require('../utils/matchingAlgorithm');

// ─── Helpers ──────────────────────────────────────────────

/** Shape one ranked result into a clean API response object */
const formatMatch = (r) => ({
  user: {
    _id:    r.user._id,
    name:   r.user.name,
    avatar: r.user.avatar,
  },
  profile: {
    age:                   r.profile.age,
    gender:                r.profile.gender,
    bio:                   r.profile.bio,
    location:              r.profile.location,
    travelInterests:       r.profile.travelInterests,
    preferredDestinations: r.profile.preferredDestinations,
    budgetRange:           r.profile.budgetRange,
    travelStyle:           r.profile.travelStyle,
    languages:             r.profile.languages,
    reputationScore:       r.profile.reputationScore,
    totalRatings:          r.profile.totalRatings,
  },
  matchScore:  r.score,
  breakdown:   r.breakdown,
});

// ─── Controllers ──────────────────────────────────────────

/**
 * @desc    Get a paginated, ranked list of travel buddy matches
 * @route   GET /api/match
 * @access  Private
 *
 * Query params (all optional):
 *   destination  {string}  - filter by destination keyword
 *   startDate    {ISO}     - trip start (requires endDate)
 *   endDate      {ISO}     - trip end   (requires startDate)
 *   minBudget    {number}  - budget lower bound
 *   maxBudget    {number}  - budget upper bound
 *   interests    {string}  - comma-separated interest tags
 *   travelStyle  {string}  - budget | mid-range | luxury | backpacker
 *   gender       {string}  - filter by gender preference
 *   minScore     {number}  - hide matches below this score (0–100)
 *   page         {number}  - default 1
 *   limit        {number}  - default 10, max 50
 */
const getMatches = async (req, res, next) => {
  try {
    const {
      destination,
      startDate, endDate,
      minBudget, maxBudget,
      interestsList,       // parsed array from validator middleware
      travelStyle, gender,
      minScore = 0,
      page = 1, limit = 10,
    } = req.query;

    // ── 1. Load requesting user's profile ──────────────────
    const sourceProfile = await Profile.findOne({ user: req.user._id });

    if (!sourceProfile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found.',
      });
    }

    // ── 2. Build MongoDB pre-filter ────────────────────────
    const candidateQuery = {
      user: { $ne: req.user._id }, // exclude self
    };

    // NOTE: destination is intentionally NOT used as a hard MongoDB filter here.
    // Filtering by preferredDestinations would exclude users who haven't pre-set
    // that destination, producing "no matches" even when compatible users exist.
    // Instead, the ranking algorithm injects the destination into effectiveSource
    // so it contributes to the score (35% weight) without eliminating anyone.

    if (minBudget || maxBudget) {
      const bMin = Number(minBudget) || 0;
      const bMax = Number(maxBudget) || Number.MAX_SAFE_INTEGER;
      candidateQuery['budgetRange.min'] = { $lte: bMax };
      candidateQuery['budgetRange.max'] = { $gte: bMin };
    }

    if (interestsList?.length) {
      candidateQuery.travelInterests = { $in: interestsList };
    }

    if (travelStyle) {
      candidateQuery.travelStyle = travelStyle;
    }

    if (gender) {
      candidateQuery.gender = gender;
    }

    // ── 3. Fetch candidate profiles ────────────────────────
    const candidateProfiles = await Profile.find(candidateQuery).populate({
      path:  'user',
      select: 'name avatar isActive',
      match: { isActive: true },
    });

    const candidates = candidateProfiles
      .filter((p) => p.user !== null) // remove inactive users (populate returned null)
      .map((p) => ({ profile: p, user: p.user }));

    if (candidates.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0, total: 0, page: 1, pages: 0,
        data: [],
        message: 'No matching profiles found. Try adjusting your filters.',
      });
    }

    // ── 4. Run matching algorithm ──────────────────────────
    const filters = { destination, startDate, endDate, minBudget, maxBudget };
    const ranked  = rankMatches(sourceProfile, candidates, filters);

    // ── 5. Apply minScore threshold ────────────────────────
    const threshold = Math.max(0, Math.min(100, Number(minScore)));
    const filtered  = ranked.filter((r) => r.score >= threshold);

    // ── 6. Paginate ────────────────────────────────────────
    const pageNum  = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const offset   = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(offset, offset + limitNum);

    // ── 7. Respond ─────────────────────────────────────────
    res.status(200).json({
      success:      true,
      count:        paginated.length,
      total:        filtered.length,
      totalRaw:     candidates.length,   // before minScore filter
      page:         pageNum,
      totalPages:   Math.ceil(filtered.length / limitNum),
      data:         paginated.map(formatMatch),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get the match score between the logged-in user and one specific user
 * @route   GET /api/match/score/:userId
 * @access  Private
 */
const getMatchScore = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot calculate match score with yourself' });
    }

    const [sourceProfile, candidateProfile] = await Promise.all([
      Profile.findOne({ user: req.user._id }),
      Profile.findOne({ user: userId }).populate('user', 'name avatar'),
    ]);

    if (!sourceProfile) {
      return res.status(404).json({ success: false, message: 'Your profile was not found' });
    }
    if (!candidateProfile) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    const { score, breakdown } = calculateMatchScore(sourceProfile, candidateProfile);

    // Build a human-readable compatibility summary
    const summary = buildCompatibilitySummary(sourceProfile, candidateProfile, score);

    // Fire new_match notifications for both users when score is good (≥60)
    // Only create if not already notified recently (last 24h)
    if (score >= 60) {
      const oneDayAgo = new Date(Date.now() - 86400000);
      const alreadyNotified = await Notification.findOne({
        recipient:  userId,
        type:       'new_match',
        'sender':   req.user._id,
        createdAt:  { $gte: oneDayAgo },
      });
      if (!alreadyNotified) {
        const { emitToUser, getIO } = require('../socket');
        const io = getIO();
        // Notify the candidate that they have a new match
        const notif = await Notification.create({
          recipient: userId,
          sender:    req.user._id,
          type:      'new_match',
          title:     'New Match Found!',
          message:   `${req.user.name} is a ${score}% travel match with you`,
          refModel:  'User',
          refId:     req.user._id,
        });
        if (io) emitToUser(io, userId, 'notification:new', notif.toObject());
      }
    }

    res.status(200).json({
      success: true,
      data: {
        user:        candidateProfile.user,
        matchScore:  score,
        breakdown,
        summary,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get top N matches (quick preview, no pagination, no filters)
 * @route   GET /api/match/top
 * @access  Private
 * @query   limit (default 5, max 10)
 */
const getTopMatches = async (req, res, next) => {
  try {
    const limit = Math.min(10, Math.max(1, Number(req.query.limit) || 5));

    const sourceProfile = await Profile.findOne({ user: req.user._id });

    if (!sourceProfile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found.',
      });
    }

    const candidateProfiles = await Profile.find({
      user: { $ne: req.user._id },
    }).populate({
      path:  'user',
      select: 'name avatar isActive',
      match: { isActive: true },
    });

    const candidates = candidateProfiles
      .filter((p) => p.user !== null)
      .map((p) => ({ profile: p, user: p.user }));

    const ranked = rankMatches(sourceProfile, candidates);
    const top    = ranked.slice(0, limit);

    res.status(200).json({
      success: true,
      count: top.length,
      data:  top.map(formatMatch),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get available filter metadata for the Find Buddy page
 * @route   GET /api/match/filters
 * @access  Private
 */
const getFilterOptions = (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      interests: [
        'adventure', 'beach', 'culture', 'food', 'history', 'nature',
        'nightlife', 'photography', 'shopping', 'spiritual', 'sports', 'wildlife',
      ],
      travelStyles: ['budget', 'mid-range', 'luxury', 'backpacker'],
      genders:      ['male', 'female', 'non-binary', 'prefer not to say'],
      currencies:   ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'],
      scoreThresholds: [
        { min: 80, label: 'Excellent',  color: '#198754' },
        { min: 60, label: 'Good',       color: '#0d6efd' },
        { min: 40, label: 'Moderate',   color: '#fd7e14' },
        { min: 0,  label: 'Low',        color: '#dc3545' },
      ],
    },
  });
};

// ─── Private helpers ──────────────────────────────────────

/**
 * Build a short human-readable compatibility message from the score + breakdown.
 */
const buildCompatibilitySummary = (src, cand, score) => {
  const sharedInterests = src.travelInterests.filter((i) =>
    cand.travelInterests.includes(i)
  );
  const sharedDests = src.preferredDestinations.filter((d) =>
    cand.preferredDestinations
      .map((x) => x.toLowerCase())
      .includes(d.toLowerCase())
  );

  const lines = [];

  if (score >= 80)      lines.push('Excellent overall compatibility.');
  else if (score >= 60) lines.push('Good overall compatibility.');
  else if (score >= 40) lines.push('Moderate compatibility.');
  else                  lines.push('Low compatibility — consider adjusting your preferences.');

  if (sharedDests.length) {
    lines.push(`Both want to visit: ${sharedDests.slice(0, 3).join(', ')}.`);
  }
  if (sharedInterests.length) {
    lines.push(`Shared interests: ${sharedInterests.slice(0, 3).join(', ')}.`);
  }
  if (src.travelStyle === cand.travelStyle) {
    lines.push(`Same travel style: ${src.travelStyle}.`);
  }

  return lines.join(' ');
};

module.exports = {
  getMatches,
  getMatchScore,
  getTopMatches,
  getFilterOptions,
};
