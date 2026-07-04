const express = require('express');
const router  = express.Router();

const {
  getMatches,
  getMatchScore,
  getTopMatches,
  getFilterOptions,
} = require('../controllers/matchController');

const { protect }            = require('../middleware/authMiddleware');
const { validateMatchQuery } = require('../middleware/validators/matchValidators');

// All match routes require authentication
router.use(protect);

// ── Named routes first (before /:userId param) ─────────────────────────────

/**
 * GET /api/match/filters
 * Returns all valid filter options for the Find Buddy UI dropdowns.
 * No DB call — static metadata.
 */
router.get('/filters', getFilterOptions);

/**
 * GET /api/match/top?limit=5
 * Quick top-N preview for the dashboard widget.
 */
router.get('/top', getTopMatches);

/**
 * GET /api/match/score/:userId
 * Detailed score + breakdown + compatibility summary vs one user.
 */
router.get('/score/:userId', getMatchScore);

// ── Primary search route ───────────────────────────────────────────────────

/**
 * GET /api/match
 * Full paginated match list with all filters applied.
 *
 * Query params:
 *   destination  {string}
 *   startDate    {ISO date}
 *   endDate      {ISO date}
 *   minBudget    {number}
 *   maxBudget    {number}
 *   interests    {string}  comma-separated
 *   travelStyle  {string}
 *   gender       {string}
 *   minScore     {number}  0–100
 *   page         {number}
 *   limit        {number}  max 50
 */
router.get('/', validateMatchQuery, getMatches);

module.exports = router;
