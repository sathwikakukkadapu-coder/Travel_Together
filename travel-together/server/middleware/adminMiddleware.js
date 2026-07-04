/**
 * Re-exports adminOnly from authMiddleware to keep imports consistent.
 * Usage: const { adminOnly } = require('../middleware/adminMiddleware');
 */
const { adminOnly } = require('./authMiddleware');

module.exports = { adminOnly };
