const express = require('express');
const router  = express.Router();

const {
  getMyProfile,
  updateMyProfile,
  updateAvatar,
  getProfileById,
  addTravelHistory,
  deleteTravelHistory,
  getProfileCompletion,
} = require('../controllers/profileController');

const { protect } = require('../middleware/authMiddleware');

const {
  validateUpdateProfile,
  validateAddTravelHistory,
} = require('../middleware/validators/profileValidators');

// All routes require authentication
router.use(protect);

// ─── Own profile ──────────────────────────────────────────
router.get('/me',                      getMyProfile);                                  // GET  /api/profile/me
router.put('/me',                      validateUpdateProfile, updateMyProfile);        // PUT  /api/profile/me
router.put('/me/avatar',               updateAvatar);                                  // PUT  /api/profile/me/avatar
router.get('/me/completion',           getProfileCompletion);                          // GET  /api/profile/me/completion

// ─── Travel History ───────────────────────────────────────
router.post('/me/travel-history',      validateAddTravelHistory, addTravelHistory);    // POST   /api/profile/me/travel-history
router.delete('/me/travel-history/:index', deleteTravelHistory);                      // DELETE /api/profile/me/travel-history/:index

// ─── Public profile ───────────────────────────────────────
// Must come after /me routes so 'me' is not treated as a userId
router.get('/:userId',                 getProfileById);                                // GET  /api/profile/:userId

module.exports = router;
