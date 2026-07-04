/**
 * Sample Documents — for reference / seeding / testing
 * These illustrate the shape of each collection.
 */

// ─── users ───────────────────────────────────────────────
const sampleUser = {
  _id: "ObjectId('64a1b2c3d4e5f6a7b8c9d0e1')",
  name: 'Arjun Sharma',
  email: 'arjun@example.com',
  password: '<bcrypt_hash>',
  avatar: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
  role: 'traveler',
  isActive: true,
  isReported: false,
  lastLogin: '2026-06-01T10:00:00.000Z',
  createdAt: '2026-01-15T08:00:00.000Z',
  updatedAt: '2026-06-01T10:00:00.000Z',
};

// ─── profiles ────────────────────────────────────────────
const sampleProfile = {
  _id: "ObjectId('64a1b2c3d4e5f6a7b8c9d0e2')",
  user: "ObjectId('64a1b2c3d4e5f6a7b8c9d0e1')",
  age: 26,
  gender: 'male',
  phone: '+91-9876543210',
  bio: 'Adventure lover who enjoys hiking and photography.',
  location: { city: 'Pune', country: 'India' },
  travelInterests: ['adventure', 'photography', 'nature'],
  preferredDestinations: ['Manali', 'Goa', 'Ladakh', 'Coorg'],
  budgetRange: { min: 5000, max: 20000, currency: 'INR' },
  travelStyle: 'backpacker',
  languages: ['English', 'Hindi', 'Marathi'],
  travelHistory: [
    {
      destination: 'Goa',
      visitedOn: '2025-12-20T00:00:00.000Z',
      description: 'New Year trip with friends.',
    },
    {
      destination: 'Manali',
      visitedOn: '2025-06-10T00:00:00.000Z',
      description: 'Solo trekking trip.',
    },
  ],
  reputationScore: 4.5,
  totalRatings: 8,
  isProfileComplete: true,
  createdAt: '2026-01-15T08:05:00.000Z',
  updatedAt: '2026-05-20T12:00:00.000Z',
};

// ─── trips ────────────────────────────────────────────────
const sampleTrip = {
  _id: "ObjectId('64a1b2c3d4e5f6a7b8c9d0e3')",
  title: 'Ladakh Road Trip 2026',
  description: 'Epic road trip from Manali to Leh. All experience levels welcome.',
  createdBy: "ObjectId('64a1b2c3d4e5f6a7b8c9d0e1')",
  destination: { city: 'Leh', country: 'India' },
  startDate: '2026-08-01T00:00:00.000Z',
  endDate: '2026-08-12T00:00:00.000Z',
  budget: { min: 15000, max: 30000, currency: 'INR' },
  interests: ['adventure', 'photography', 'nature'],
  maxMembers: 6,
  members: [
    {
      user: "ObjectId('64a1b2c3d4e5f6a7b8c9d0e4')",
      joinedAt: '2026-06-02T09:00:00.000Z',
      status: 'accepted',
    },
  ],
  status: 'upcoming',
  coverImage: '',
  isPublic: true,
  createdAt: '2026-06-01T11:00:00.000Z',
  updatedAt: '2026-06-02T09:00:00.000Z',
};

// ─── messages ─────────────────────────────────────────────
const sampleMessage = {
  _id: "ObjectId('64a1b2c3d4e5f6a7b8c9d0e5')",
  conversationId:
    '64a1b2c3d4e5f6a7b8c9d0e1_64a1b2c3d4e5f6a7b8c9d0e4', // sorted IDs joined by _
  sender: "ObjectId('64a1b2c3d4e5f6a7b8c9d0e1')",
  receiver: "ObjectId('64a1b2c3d4e5f6a7b8c9d0e4')",
  content: 'Hey! I saw you are also planning to go to Ladakh. Want to join my trip?',
  isRead: false,
  readAt: null,
  createdAt: '2026-06-02T10:30:00.000Z',
  updatedAt: '2026-06-02T10:30:00.000Z',
};

// ─── notifications ────────────────────────────────────────
const sampleNotification = {
  _id: "ObjectId('64a1b2c3d4e5f6a7b8c9d0e6')",
  recipient: "ObjectId('64a1b2c3d4e5f6a7b8c9d0e1')",
  sender: "ObjectId('64a1b2c3d4e5f6a7b8c9d0e4')",
  type: 'new_match',
  title: 'New Travel Match!',
  message: 'Priya Mehta is a 87% match for your Ladakh trip.',
  refModel: 'User',
  refId: "ObjectId('64a1b2c3d4e5f6a7b8c9d0e4')",
  isRead: false,
  readAt: null,
  createdAt: '2026-06-02T09:45:00.000Z',
  updatedAt: '2026-06-02T09:45:00.000Z',
};

// ─── reviews ──────────────────────────────────────────────
const sampleReview = {
  _id: "ObjectId('64a1b2c3d4e5f6a7b8c9d0e7')",
  reviewee: "ObjectId('64a1b2c3d4e5f6a7b8c9d0e1')",
  reviewer: "ObjectId('64a1b2c3d4e5f6a7b8c9d0e4')",
  trip: "ObjectId('64a1b2c3d4e5f6a7b8c9d0e3')",
  rating: 5,
  feedback: 'Great travel companion! Very reliable and fun to be around.',
  tags: ['friendly', 'reliable', 'fun'],
  isVisible: true,
  createdAt: '2026-08-13T16:00:00.000Z',
  updatedAt: '2026-08-13T16:00:00.000Z',
};

// ─── reports ──────────────────────────────────────────────
const sampleReport = {
  _id: "ObjectId('64a1b2c3d4e5f6a7b8c9d0e8')",
  reportedBy: "ObjectId('64a1b2c3d4e5f6a7b8c9d0e4')",
  reportedUser: "ObjectId('64a1b2c3d4e5f6a7b8c9d0e9')",
  reason: 'fake_profile',
  description: 'This user has fake photos and did not show up for the trip.',
  status: 'pending',
  adminNote: '',
  resolvedBy: null,
  resolvedAt: null,
  createdAt: '2026-06-03T08:00:00.000Z',
  updatedAt: '2026-06-03T08:00:00.000Z',
};

module.exports = {
  sampleUser,
  sampleProfile,
  sampleTrip,
  sampleMessage,
  sampleNotification,
  sampleReview,
  sampleReport,
};
