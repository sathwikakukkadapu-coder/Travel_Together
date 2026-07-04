const express = require('express');
const router  = express.Router();

const { protect } = require('../middleware/authMiddleware');
const {
  getTrips,
  getMyTrips,
  getTripById,
  getTripMembers,
  createTrip,
  updateTrip,
  deleteTrip,
  joinTrip,
  leaveTrip,
  updateMemberStatus,
} = require('../controllers/tripController');

// All trip routes require authentication
router.use(protect);

// Discovery + my trips
router.get('/',    getTrips);
router.get('/my',  getMyTrips);

// CRUD
router.post('/',        createTrip);
router.get('/:id',      getTripById);
router.get('/:id/members', getTripMembers);
router.put('/:id',      updateTrip);
router.delete('/:id',   deleteTrip);

// Membership
router.post('/:id/join',                  joinTrip);
router.post('/:id/leave',                 leaveTrip);
router.put('/:id/members/:memberId',      updateMemberStatus);

module.exports = router;
