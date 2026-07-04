/**
 * Profile Validators
 * Route-level middleware that validates and sanitizes profile request bodies
 * before they reach the controller. Returns 400 on any violation.
 */

const VALID_INTERESTS = [
  'adventure', 'beach', 'culture', 'food', 'history', 'nature',
  'nightlife', 'photography', 'shopping', 'spiritual', 'sports', 'wildlife',
];

const VALID_TRAVEL_STYLES = ['budget', 'mid-range', 'luxury', 'backpacker'];

const VALID_GENDERS = ['male', 'female', 'non-binary', 'prefer not to say'];

const VALID_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];

const fail = (res, message) =>
  res.status(400).json({ success: false, message });

// ─── validateUpdateProfile ────────────────────────────────
/**
 * PUT /api/profile/me
 * All fields optional — validates only what is present.
 */
const validateUpdateProfile = (req, res, next) => {
  const {
    age, gender, phone, bio,
    travelInterests, preferredDestinations,
    budgetRange, travelStyle, languages,
  } = req.body;

  // age
  if (age !== undefined) {
    const n = Number(age);
    if (!Number.isInteger(n) || n < 18 || n > 100) {
      return fail(res, 'Age must be a whole number between 18 and 100');
    }
  }

  // gender
  if (gender !== undefined && !VALID_GENDERS.includes(gender)) {
    return fail(res, `Gender must be one of: ${VALID_GENDERS.join(', ')}`);
  }

  // phone — loose E.164-ish check
  if (phone !== undefined && phone !== '') {
    if (!/^\+?[\d\s\-().]{7,20}$/.test(phone)) {
      return fail(res, 'Please provide a valid phone number');
    }
  }

  // bio
  if (bio !== undefined && bio.length > 500) {
    return fail(res, 'Bio cannot exceed 500 characters');
  }

  // travelInterests
  if (travelInterests !== undefined) {
    if (!Array.isArray(travelInterests)) {
      return fail(res, 'travelInterests must be an array');
    }
    const invalid = travelInterests.filter((i) => !VALID_INTERESTS.includes(i));
    if (invalid.length) {
      return fail(res, `Invalid interest(s): ${invalid.join(', ')}. Allowed: ${VALID_INTERESTS.join(', ')}`);
    }
  }

  // preferredDestinations
  if (preferredDestinations !== undefined) {
    if (!Array.isArray(preferredDestinations)) {
      return fail(res, 'preferredDestinations must be an array');
    }
    if (preferredDestinations.length > 20) {
      return fail(res, 'You can add up to 20 preferred destinations');
    }
    if (preferredDestinations.some((d) => typeof d !== 'string' || d.trim().length === 0)) {
      return fail(res, 'Each destination must be a non-empty string');
    }
    // Sanitize
    req.body.preferredDestinations = preferredDestinations.map((d) => d.trim());
  }

  // budgetRange
  if (budgetRange !== undefined) {
    const { min, max, currency } = budgetRange;
    if (min === undefined || max === undefined) {
      return fail(res, 'budgetRange must include both min and max');
    }
    if (Number(min) < 0 || Number(max) < 0) {
      return fail(res, 'Budget values cannot be negative');
    }
    if (Number(min) > Number(max)) {
      return fail(res, 'Budget min cannot be greater than max');
    }
    if (currency && !VALID_CURRENCIES.includes(currency)) {
      return fail(res, `Currency must be one of: ${VALID_CURRENCIES.join(', ')}`);
    }
  }

  // travelStyle
  if (travelStyle !== undefined && !VALID_TRAVEL_STYLES.includes(travelStyle)) {
    return fail(res, `travelStyle must be one of: ${VALID_TRAVEL_STYLES.join(', ')}`);
  }

  // languages
  if (languages !== undefined) {
    if (!Array.isArray(languages)) {
      return fail(res, 'languages must be an array');
    }
    if (languages.length > 10) {
      return fail(res, 'You can add up to 10 languages');
    }
  }

  next();
};

// ─── validateAddTravelHistory ─────────────────────────────
/**
 * POST /api/profile/me/travel-history
 */
const validateAddTravelHistory = (req, res, next) => {
  const { destination, visitedOn, description } = req.body;

  if (!destination || !destination.trim()) {
    return fail(res, 'Destination is required');
  }
  if (destination.trim().length > 100) {
    return fail(res, 'Destination cannot exceed 100 characters');
  }

  if (visitedOn) {
    const date = new Date(visitedOn);
    if (isNaN(date.getTime())) {
      return fail(res, 'visitedOn must be a valid date');
    }
    if (date > new Date()) {
      return fail(res, 'visitedOn cannot be a future date');
    }
  }

  if (description && description.length > 300) {
    return fail(res, 'Description cannot exceed 300 characters');
  }

  req.body.destination = destination.trim();
  next();
};

module.exports = { validateUpdateProfile, validateAddTravelHistory };
