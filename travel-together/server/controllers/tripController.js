const Trip         = require('../models/Trip');
const Notification = require('../models/Notification');

// ─── helpers ─────────────────────────────────────────────

const tripStatus = (trip) => {
  const now   = new Date();
  const start = new Date(trip.startDate);
  const end   = new Date(trip.endDate);
  if (now < start) return 'upcoming';
  if (now > end)   return 'completed';
  return 'ongoing';
};

// ─── controllers ─────────────────────────────────────────

/**
 * @desc  Get public trips (discovery / browse)
 * @route GET /api/trips
 * @access Private
 * @query destination, startDate, endDate, minBudget, maxBudget, page, limit
 */
const getTrips = async (req, res, next) => {
  try {
    const {
      destination,
      startDate, endDate,
      minBudget, maxBudget,
      page = 1, limit = 12,
    } = req.query;

    const query = { isPublic: true };

    if (destination) {
      query['destination.city'] = { $regex: destination, $options: 'i' };
    }
    // Date overlap: find trips whose dates overlap the searched window
    // A trip overlaps if: trip.startDate <= searchEnd AND trip.endDate >= searchStart
    if (startDate) query.startDate = { $lte: endDate ? new Date(endDate) : new Date('2100-01-01') };
    if (endDate)   query.endDate   = { $gte: startDate ? new Date(startDate) : new Date() };
    if (minBudget || maxBudget) {
      if (minBudget) query['budget.min'] = { $gte: Number(minBudget) };
      if (maxBudget) query['budget.max'] = { $lte: Number(maxBudget) };
    }

    const pageNum  = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [trips, total] = await Promise.all([
      Trip.find(query)
        .populate('createdBy', 'name avatar')
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(limitNum),
      Trip.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: trips.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: trips,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Get trips the logged-in user created or is a member of
 * @route GET /api/trips/my
 * @access Private
 */
const getMyTrips = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const trips = await Trip.find({
      $or: [
        { createdBy: userId },
        { 'members.user': userId },
      ],
    })
      .populate('createdBy', 'name avatar')
      .populate('members.user', 'name avatar')
      .sort({ startDate: 1 });

    res.status(200).json({
      success: true,
      count: trips.length,
      data: trips,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Get a single trip by ID
 * @route GET /api/trips/:id
 * @access Private
 */
const getTripById = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('createdBy', 'name avatar email')
      .populate('members.user', 'name avatar email');

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Allow access if public, or if user is creator/member
    const userId   = req.user._id.toString();
    const isOwner  = trip.createdBy._id.toString() === userId;
    const isMember = trip.members.some((m) => m.user._id.toString() === userId);

    if (!trip.isPublic && !isOwner && !isMember) {
      return res.status(403).json({ success: false, message: 'This trip is private' });
    }

    res.status(200).json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Create a new trip
 * @route POST /api/trips
 * @access Private
 */
const createTrip = async (req, res, next) => {
  try {
    const {
      title, description,
      destination, startDate, endDate,
      budget, interests, maxMembers, isPublic,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!destination?.city) {
      return res.status(400).json({ success: false, message: 'Destination city is required' });
    }
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start and end dates are required' });
    }
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }

    const trip = await Trip.create({
      title:       title.trim(),
      description: description?.trim() || '',
      createdBy:   req.user._id,
      destination: {
        city:    destination.city.trim(),
        country: destination.country?.trim() || '',
      },
      startDate: new Date(startDate),
      endDate:   new Date(endDate),
      budget:    budget || { min: 0, max: 0, currency: 'INR' },
      interests: interests || [],
      maxMembers: maxMembers ? Number(maxMembers) : 5,
      isPublic:   isPublic !== false,
    });

    await trip.populate('createdBy', 'name avatar');

    // Notify all active users about the new public trip
    if (trip.isPublic) {
      try {
        const User = require('../models/User');
        const { getIO, emitToUser } = require('../socket');
        const io = getIO();
        const allUsers = await User.find({
          _id:      { $ne: req.user._id },
          isActive: true,
        }).select('_id').lean();

        for (const u of allUsers) {
          const notif = await Notification.create({
            recipient: u._id,
            sender:    req.user._id,
            type:      'trip_invite',
            title:     `New trip to ${trip.destination.city}!`,
            message:   `${req.user.name} created a new trip to ${trip.destination.city}${trip.destination.country ? ', ' + trip.destination.country : ''}. Dates: ${trip.startDate.toDateString()} – ${trip.endDate.toDateString()}.`,
            refModel:  'Trip',
            refId:     trip._id,
          });
          if (io) emitToUser(io, u._id.toString(), 'notification:new', notif.toObject());
        }
      } catch { /* non-critical — don't fail trip creation */ }
    }

    res.status(201).json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Update a trip (creator only)
 * @route PUT /api/trips/:id
 * @access Private
 */
const updateTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    if (trip.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the trip creator can update it' });
    }

    const allowed = [
      'title', 'description', 'destination', 'startDate', 'endDate',
      'budget', 'interests', 'maxMembers', 'isPublic', 'coverImage',
    ];

    const updates = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const updated = await Trip.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name avatar').populate('members.user', 'name avatar');

    // Notify members of the update
    const memberIds = trip.members.map((m) => m.user.toString());
    if (memberIds.length > 0) {
      const notifications = memberIds.map((uid) => ({
        recipient: uid,
        sender:    req.user._id,
        type:      'trip_update',
        title:     'Trip Updated',
        message:   `${req.user.name} updated the trip "${trip.title}"`,
        refModel:  'Trip',
        refId:     trip._id,
      }));
      const saved = await Notification.insertMany(notifications);
      // Push real-time notifications via socket
      const { emitToUser, getIO } = require('../socket');
      const io = getIO();
      if (io) {
        saved.forEach((n) => emitToUser(io, n.recipient.toString(), 'notification:new', n.toObject()));
      }
    }

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Delete a trip (creator only)
 * @route DELETE /api/trips/:id
 * @access Private
 */
const deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    if (trip.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the trip creator can delete it' });
    }

    // Notify all members before deleting, then emit real-time
    const memberIds = trip.members.map((m) => m.user.toString());

    await trip.deleteOne();

    if (memberIds.length > 0) {
      const saved = await Notification.insertMany(memberIds.map((uid) => ({
        recipient: uid,
        sender:    req.user._id,
        type:      'trip_cancelled',
        title:     'Trip Cancelled',
        message:   `The trip "${trip.title}" has been cancelled by the organizer`,
        refModel:  'Trip',
        refId:     trip._id,
      })));
      const { emitToUser, getIO } = require('../socket');
      const io = getIO();
      if (io) saved.forEach((n) => emitToUser(io, n.recipient.toString(), 'notification:new', n.toObject()));
    }

    res.status(200).json({ success: true, message: 'Trip deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Request to join a trip
 * @route POST /api/trips/:id/join
 * @access Private
 */
const joinTrip = async (req, res, next) => {
  try {
    const trip   = await Trip.findById(req.params.id);
    const userId = req.user._id;

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    if (trip.createdBy.toString() === userId.toString()) {
      return res.status(400).json({ success: false, message: 'You are the trip creator' });
    }

    // ── Problem 1: Block joining ongoing trips ────────────────────────────
    const now = new Date();
    if (new Date(trip.startDate) <= now) {
      return res.status(400).json({
        success: false,
        message: 'Sorry, this trip has already started. You can no longer join this trip.',
      });
    }

    const alreadyMember = trip.members.some(
      (m) => m.user.toString() === userId.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ success: false, message: 'Already a member of this trip' });
    }

    // ── Problem 2: Enforce trip capacity ──────────────────────────────────
    // Total occupancy = creator (1) + accepted members
    const acceptedCount = trip.members.filter((m) => m.status === 'accepted').length;
    const totalOccupied = acceptedCount + 1; // +1 for creator
    if (totalOccupied >= trip.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Slots are full for this trip.',
      });
    }

    trip.members.push({ user: userId, status: 'accepted' });
    await trip.save();

    // Notify trip creator
    const joinNotif = await Notification.create({
      recipient: trip.createdBy,
      sender:    userId,
      type:      'trip_join',
      title:     'New Member Joined!',
      message:   `${req.user.name} joined your trip "${trip.title}" to ${trip.destination?.city || ''}`,
      refModel:  'Trip',
      refId:     trip._id,
    });
    const { emitToUser, getIO } = require('../socket');
    const io = getIO();
    if (io) emitToUser(io, trip.createdBy.toString(), 'notification:new', joinNotif.toObject());

    res.status(200).json({ success: true, message: 'You have successfully joined this trip.' });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Leave a trip
 * @route POST /api/trips/:id/leave
 * @access Private
 */
const leaveTrip = async (req, res, next) => {
  try {
    const trip   = await Trip.findById(req.params.id);
    const userId = req.user._id.toString();

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    if (trip.createdBy.toString() === userId) {
      return res.status(400).json({ success: false, message: 'Creator cannot leave their own trip. Delete it instead.' });
    }

    const idx = trip.members.findIndex((m) => m.user.toString() === userId);
    if (idx === -1) {
      return res.status(400).json({ success: false, message: 'You are not a member of this trip' });
    }

    trip.members.splice(idx, 1);
    await trip.save();

    res.status(200).json({ success: true, message: 'Left trip successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Update a member's status (creator only — accept / reject)
 * @route PUT /api/trips/:id/members/:memberId
 * @access Private
 */
const updateMemberStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const trip       = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    if (trip.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the creator can manage members' });
    }
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be accepted or rejected' });
    }

    const member = trip.members.find((m) => m.user.toString() === req.params.memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found in this trip' });
    }

    member.status = status;
    await trip.save();

    // Notify the member
    const memberNotif = await Notification.create({
      recipient: member.user,
      sender:    req.user._id,
      type:      'trip_update',
      title:     status === 'accepted' ? 'Join Request Accepted' : 'Join Request Rejected',
      message:   `Your request to join "${trip.title}" was ${status}`,
      refModel:  'Trip',
      refId:     trip._id,
    });
    const { emitToUser, getIO } = require('../socket');
    const io = getIO();
    if (io) emitToUser(io, member.user.toString(), 'notification:new', memberNotif.toObject());

    res.status(200).json({ success: true, data: trip.members });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc  Get trip members with profile details + match scores vs requesting user
 * @route GET /api/trips/:id/members
 * @access Private
 */
const getTripMembers = async (req, res, next) => {
  try {
    const Profile              = require('../models/Profile');
    const { calculateMatchScore } = require('../utils/matchingAlgorithm');

    const trip = await Trip.findById(req.params.id)
      .populate('createdBy', 'name avatar')
      .populate('members.user', 'name avatar');

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    if (!trip.isPublic) {
      const userId = req.user._id.toString();
      const isOwner  = trip.createdBy._id.toString() === userId;
      const isMember = trip.members.some((m) => m.user?._id?.toString() === userId);
      if (!isOwner && !isMember) {
        return res.status(403).json({ success: false, message: 'This trip is private' });
      }
    }

    // Load the requesting user's profile for match score calculation
    const myProfile = await Profile.findOne({ user: req.user._id });

    // Build list: creator first, then accepted members
    const memberUsers = [
      { user: trip.createdBy, role: 'Creator' },
      ...trip.members
        .filter((m) => m.status === 'accepted')
        .map((m) => ({ user: m.user, role: 'Member' })),
    ];

    const results = await Promise.all(
      memberUsers.map(async ({ user: memberUser, role }) => {
        const userId = memberUser?._id;
        if (!userId) return null;

        const profile = await Profile.findOne({ user: userId });

        let matchScore = null;
        let breakdown  = null;
        if (myProfile && profile && userId.toString() !== req.user._id.toString()) {
          const result = calculateMatchScore(myProfile, profile);
          matchScore = result.score;
          breakdown  = result.breakdown;
        }

        return {
          user: {
            _id:    memberUser._id,
            name:   memberUser.name,
            avatar: memberUser.avatar,
          },
          profile: profile ? {
            age:             profile.age,
            gender:          profile.gender,
            bio:             profile.bio,
            location:        profile.location,
            travelInterests: profile.travelInterests,
            travelStyle:     profile.travelStyle,
            budgetRange:     profile.budgetRange,
            languages:       profile.languages,
            reputationScore: profile.reputationScore,
          } : null,
          role,
          matchScore,
          breakdown,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: results.filter(Boolean).length,
      data:  results.filter(Boolean),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};
