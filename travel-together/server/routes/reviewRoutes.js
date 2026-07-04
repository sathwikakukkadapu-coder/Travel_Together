const express = require('express');
const router  = express.Router();

const { protect } = require('../middleware/authMiddleware');
const {
  getReviewsForUser,
  getMyReviews,
  getReviewsGiven,
  createReview,
  deleteReview,
  searchUsers,
} = require('../controllers/reviewController');

router.use(protect);

router.get('/me',              getMyReviews);
router.get('/given',           getReviewsGiven);
router.get('/search-users',    searchUsers);
router.get('/user/:userId',    getReviewsForUser);
router.post('/',               createReview);
router.delete('/:id',          deleteReview);

module.exports = router;
