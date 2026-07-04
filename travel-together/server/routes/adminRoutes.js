const express = require('express');
const router  = express.Router();

const { protect }   = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const {
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
} = require('../controllers/adminController');

// ── Public-facing (any logged-in user) ────────────────────
router.post('/reports', protect, submitReport);

// ── Admin-only routes ─────────────────────────────────────
router.use(protect, adminOnly);

router.get('/stats',                   getStats);

router.get('/users',                   getUsers);
router.get('/users/:id',               getUserById);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.delete('/users/:id',            deleteUser);

router.get('/reports',                 getReports);
router.put('/reports/:id',             updateReportStatus);

router.get('/reviews',                 getReviews);
router.put('/reviews/:id',             updateReviewVisibility);

module.exports = router;
