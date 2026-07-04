/**
 * Travel Together — Matching Algorithm
 * ─────────────────────────────────────
 * Produces a compatibility score (0–100) between two Profile documents.
 *
 * Scoring weights:
 *   Destination similarity   35%
 *   Budget compatibility      25%
 *   Interest similarity       25%
 *   Travel date overlap       15%  (only when both profiles carry trip dates)
 *   Travel style bonus        +5   (capped — final never exceeds 100)
 *
 * All scorers are pure functions: no DB access, fully unit-testable.
 */

// ─── Individual Scorers ───────────────────────────────────

/**
 * scoreDestination (0–100)
 * Jaccard similarity of two normalised destination arrays.
 *
 * e.g. src: ['Goa','Manali']  cand: ['Goa','Ladakh']
 *      intersection = 1, union = 3  →  33
 */
const scoreDestination = (srcDests = [], candDests = []) => {
  if (!srcDests.length || !candDests.length) return 0;

  const norm  = (s) => s.toLowerCase().trim();
  const setA  = new Set(srcDests.map(norm));
  const setB  = new Set(candDests.map(norm));

  const intersection = [...setA].filter((d) => setB.has(d)).length;
  if (intersection === 0) return 0;

  const union = new Set([...setA, ...setB]).size;
  return Math.round((intersection / union) * 100);
};

/**
 * scoreBudget (0–100)
 * Overlap of two [min, max] numeric ranges, normalised by their union span.
 *
 * Full containment → 100, partial → proportional, no overlap → 0.
 */
const scoreBudget = (srcBudget = {}, candBudget = {}) => {
  const sMin = Number(srcBudget.min)  || 0;
  const sMax = Number(srcBudget.max)  || 0;
  const cMin = Number(candBudget.min) || 0;
  const cMax = Number(candBudget.max) || 0;

  // Can't score if either side has no budget set
  if (sMax === 0 || cMax === 0) return 0;

  const overlapStart = Math.max(sMin, cMin);
  const overlapEnd   = Math.min(sMax, cMax);

  if (overlapEnd <= overlapStart) return 0; // no overlap

  const overlapSpan = overlapEnd   - overlapStart;
  const unionSpan   = Math.max(sMax, cMax) - Math.min(sMin, cMin);

  return unionSpan === 0 ? 100 : Math.round((overlapSpan / unionSpan) * 100);
};

/**
 * scoreInterests (0–100)
 * Jaccard similarity of two interest arrays.
 */
const scoreInterests = (srcInterests = [], candInterests = []) => {
  if (!srcInterests.length || !candInterests.length) return 0;

  const setA = new Set(srcInterests);
  const setB = new Set(candInterests);

  const intersection = [...setA].filter((i) => setB.has(i)).length;
  const union        = new Set([...setA, ...setB]).size;

  return union === 0 ? 0 : Math.round((intersection / union) * 100);
};

/**
 * scoreDateOverlap (0–100)
 * Compares a search window { startDate, endDate } against a candidate's
 * trip availability window. Uses day-level overlap / union ratio.
 *
 * Returns 50 (neutral) when either window is missing — avoids penalising
 * users who haven't set dates yet.
 */
const scoreDateOverlap = (filterWindow, candWindow) => {
  if (
    !filterWindow?.startDate || !filterWindow?.endDate ||
    !candWindow?.startDate   || !candWindow?.endDate
  ) {
    return 50; // neutral — dates unknown
  }

  const fStart = new Date(filterWindow.startDate).getTime();
  const fEnd   = new Date(filterWindow.endDate).getTime();
  const cStart = new Date(candWindow.startDate).getTime();
  const cEnd   = new Date(candWindow.endDate).getTime();

  // Validate parsed dates
  if (isNaN(fStart) || isNaN(fEnd) || isNaN(cStart) || isNaN(cEnd)) return 50;
  if (fEnd <= fStart || cEnd <= cStart) return 50;

  const overlapStart = Math.max(fStart, cStart);
  const overlapEnd   = Math.min(fEnd,   cEnd);

  if (overlapEnd <= overlapStart) return 0; // no overlap

  const overlapMs = overlapEnd   - overlapStart;
  const unionMs   = Math.max(fEnd, cEnd) - Math.min(fStart, cStart);

  return unionMs === 0 ? 100 : Math.round((overlapMs / unionMs) * 100);
};

/**
 * bonusTravelStyle (0–5)
 * Exact enum match earns a small bonus. Capped at 5 so it can't
 * dominate the weighted score.
 */
const bonusTravelStyle = (srcStyle, candStyle) => {
  if (!srcStyle || !candStyle) return 0;
  return srcStyle === candStyle ? 5 : 0;
};

// ─── Main Scorer ──────────────────────────────────────────

/**
 * calculateMatchScore
 *
 * @param  {Object} sourceProfile    — Profile doc of the requesting user
 * @param  {Object} candidateProfile — Profile doc of the candidate
 * @param  {Object} [filterWindow]   — Optional { startDate, endDate } from search
 * @param  {Object} [candWindow]     — Optional { startDate, endDate } from candidate's upcoming trip
 * @returns {{ score: number, breakdown: Object }}
 */
const calculateMatchScore = (
  sourceProfile,
  candidateProfile,
  filterWindow = null,
  candWindow   = null
) => {
  const destScore     = scoreDestination(
    sourceProfile.preferredDestinations,
    candidateProfile.preferredDestinations
  );

  const budgetScore   = scoreBudget(
    sourceProfile.budgetRange,
    candidateProfile.budgetRange
  );

  const interestScore = scoreInterests(
    sourceProfile.travelInterests,
    candidateProfile.travelInterests
  );

  // Date score only meaningful when a filter window was supplied
  const dateScore = scoreDateOverlap(filterWindow, candWindow);

  const styleBonus = bonusTravelStyle(
    sourceProfile.travelStyle,
    candidateProfile.travelStyle
  );

  const weighted =
    destScore     * 0.35 +
    budgetScore   * 0.25 +
    interestScore * 0.25 +
    dateScore     * 0.15;

  const total = Math.min(100, Math.round(weighted + styleBonus));

  return {
    score: total,
    breakdown: {
      destination:  { score: destScore,     weight: '35%' },
      budget:       { score: budgetScore,   weight: '25%' },
      interests:    { score: interestScore, weight: '25%' },
      travelDates:  { score: dateScore,     weight: '15%' },
      styleBonus:   { score: styleBonus,    weight: 'bonus (+5 max)' },
    },
  };
};

// ─── Batch Ranker ─────────────────────────────────────────

/**
 * rankMatches
 * Scores every candidate against sourceProfile and returns them
 * sorted descending by score, with reputationScore as tie-breaker.
 *
 * @param  {Object}   sourceProfile
 * @param  {Object[]} candidates     — [{ profile, user }]
 * @param  {Object}   [filters]      — { destination, startDate, endDate, minBudget, maxBudget }
 * @returns {Object[]} [{ user, profile, score, breakdown }]
 */
const rankMatches = (sourceProfile, candidates, filters = {}) => {
  const filterWindow =
    filters.startDate && filters.endDate
      ? { startDate: filters.startDate, endDate: filters.endDate }
      : null;

  // Build a source profile that reflects the active destination filter so
  // the destination scorer compares filter intent vs candidate destinations
  const effectiveSource = filters.destination
    ? {
        ...sourceProfile.toObject(),
        preferredDestinations: [
          ...new Set([
            ...sourceProfile.preferredDestinations.map((d) => d.toLowerCase().trim()),
            filters.destination.toLowerCase().trim(),
          ]),
        ],
      }
    : sourceProfile;

  const results = candidates.map(({ profile, user }) => {
    // Candidate window: attached from a trip lookup when available
    const candWindow = profile._tripWindow || null;

    const { score, breakdown } = calculateMatchScore(
      effectiveSource,
      profile,
      filterWindow,
      candWindow
    );

    return { user, profile, score, breakdown };
  });

  return results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Tie-break: higher reputation first
    return (b.profile.reputationScore || 0) - (a.profile.reputationScore || 0);
  });
};

// ─── Exports ──────────────────────────────────────────────

module.exports = {
  calculateMatchScore,
  rankMatches,
  // Export individual scorers for unit testing
  _scorers: {
    scoreDestination,
    scoreBudget,
    scoreInterests,
    scoreDateOverlap,
    bonusTravelStyle,
  },
};
