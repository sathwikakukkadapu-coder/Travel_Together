/**
 * Shared utility functions used across the app.
 */

/** Format an ISO date string into a readable label */
export const formatDate = (iso, options = {}) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    ...options,
  });
};

/** Return initials from a full name — used in avatar fallback */
export const getInitials = (name = '') =>
  name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

/** Classify a match score into a label + CSS modifier */
export const classifyScore = (score) => {
  if (score >= 80) return { label: 'Excellent', cls: 'excellent', color: '#198754' };
  if (score >= 60) return { label: 'Good',      cls: 'good',      color: '#0d6efd' };
  if (score >= 40) return { label: 'Moderate',  cls: 'moderate',  color: '#fd7e14' };
  return            { label: 'Low',             cls: 'low',       color: '#dc3545' };
};

/** Truncate a string to maxLen characters */
export const truncate = (str = '', maxLen = 100) =>
  str.length <= maxLen ? str : `${str.slice(0, maxLen).trimEnd()}…`;

/** Convert budget numbers to a compact display string */
export const formatBudget = (range) => {
  if (!range?.max) return 'Not set';
  const { min = 0, max, currency = 'INR' } = range;
  const fmt = (n) =>
    n >= 100000
      ? `${(n / 100000).toFixed(1)}L`
      : n >= 1000
      ? `${(n / 1000).toFixed(0)}K`
      : String(n);
  return `${currency} ${fmt(min)} – ${fmt(max)}`;
};

/** Extract error message from an Axios error */
export const getErrorMessage = (err) =>
  err?.response?.data?.message || err?.message || 'Something went wrong';
