/**
 * Match Validators
 * Route-level middleware for GET /api/match query parameters.
 */

const VALID_INTERESTS = [
  'adventure', 'beach', 'culture', 'food', 'history', 'nature',
  'nightlife', 'photography', 'shopping', 'spiritual', 'sports', 'wildlife',
];

const VALID_STYLES = ['budget', 'mid-range', 'luxury', 'backpacker'];

const fail = (res, message) =>
  res.status(400).json({ success: false, message });

/**
 * Validate + coerce query params for GET /api/match
 * All params are optional — only validates what is present.
 */
const validateMatchQuery = (req, res, next) => {
  const {
    startDate, endDate,
    minBudget, maxBudget,
    minScore, page, limit,
    interests, travelStyle,
  } = req.query;

  // Date pair — if one is given, both are required
  if ((startDate && !endDate) || (!startDate && endDate)) {
    return fail(res, 'Both startDate and endDate are required when filtering by date');
  }

  if (startDate && endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s.getTime())) return fail(res, 'startDate is not a valid date');
    if (isNaN(e.getTime())) return fail(res, 'endDate is not a valid date');
    if (e <= s)             return fail(res, 'endDate must be after startDate');
  }

  // Budget
  if (minBudget !== undefined) {
    const v = Number(minBudget);
    if (isNaN(v) || v < 0) return fail(res, 'minBudget must be a non-negative number');
  }
  if (maxBudget !== undefined) {
    const v = Number(maxBudget);
    if (isNaN(v) || v < 0) return fail(res, 'maxBudget must be a non-negative number');
  }
  if (minBudget !== undefined && maxBudget !== undefined) {
    if (Number(minBudget) > Number(maxBudget)) {
      return fail(res, 'minBudget cannot be greater than maxBudget');
    }
  }

  // minScore
  if (minScore !== undefined) {
    const v = Number(minScore);
    if (isNaN(v) || v < 0 || v > 100) {
      return fail(res, 'minScore must be a number between 0 and 100');
    }
  }

  // pagination
  if (page !== undefined && (isNaN(Number(page)) || Number(page) < 1)) {
    return fail(res, 'page must be a positive integer');
  }
  if (limit !== undefined) {
    const v = Number(limit);
    if (isNaN(v) || v < 1 || v > 50) {
      return fail(res, 'limit must be between 1 and 50');
    }
  }

  // interests filter (comma-separated string)
  if (interests) {
    const list = interests.split(',').map((i) => i.trim().toLowerCase());
    const invalid = list.filter((i) => !VALID_INTERESTS.includes(i));
    if (invalid.length) {
      return fail(res, `Invalid interest(s): ${invalid.join(', ')}`);
    }
    req.query.interestsList = list; // parsed array for controller
  }

  // travelStyle filter
  if (travelStyle && !VALID_STYLES.includes(travelStyle)) {
    return fail(res, `travelStyle must be one of: ${VALID_STYLES.join(', ')}`);
  }

  next();
};

module.exports = { validateMatchQuery };
