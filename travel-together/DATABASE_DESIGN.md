# Travel Together - MongoDB Database Design

**Database:** travel_together | **ODM:** Mongoose 8.x | **Collections:** 7

---

## Entity Relationships

```
users ------------ profiles        1 : 1   (users._id -> profiles.user)
users ------------ trips           1 : N   (users._id -> trips.createdBy)
users ------------ trips.members   M : N   (embedded array in trips)
users ------------ messages        M : N   (sender/receiver, conversationId key)
users ------------ notifications   1 : N   (users._id -> notifications.recipient)
users ------------ reviews         M : N   (reviewer <-> reviewee)
users ------------ reports         M : N   (reportedBy <-> reportedUser)
trips ------------ reviews         1 : N   (trips._id -> reviews.trip, optional)
```

---

## Collection 1 - users

Purpose: Authentication and account state only. Travel data lives in profiles.

Fields:
  _id         ObjectId   auto      Primary key
  name        String     required  maxlength 100, trimmed
  email       String     required  unique, lowercase, regex validated
  password    String     required  bcrypt hash cost 12, select:false
  avatar      String               URL, default empty
  role        String               enum: traveler | admin, default traveler
  isActive    Boolean              default true
  isReported  Boolean              default false
  lastLogin   Date                 updated on each login
  createdAt   Date       auto
  updatedAt   Date       auto

Indexes: email (unique), role, isActive, createdAt desc

Sample:
{
  "_id": "ObjectId('64a1b2c3d4e5f6a7b8c9d0e1')",
  "name": "Arjun Sharma",
  "email": "arjun@example.com",
  "password": "$2a$12$hashedvalue...",
  "role": "traveler",
  "isActive": true,
  "isReported": false,
  "lastLogin": "2026-06-01T10:00:00.000Z",
  "createdAt": "2026-01-15T08:00:00.000Z"
}

---

## Collection 2 - profiles

Purpose: Travel preferences for matching. 1-to-1 with users. Auto-created on registration.

Fields:
  _id                   ObjectId   auto
  user                  ObjectId   required, ref:User, unique
  age                   Number               min:18, max:100
  gender                String               enum: male|female|non-binary|prefer not to say
  phone                 String               trimmed
  bio                   String               maxlength:500
  location.city         String               default empty
  location.country      String               default empty
  travelInterests       [String]             enum of 12 values (see below)
  preferredDestinations [String]             free text
  budgetRange.min       Number               default 0
  budgetRange.max       Number               default 0
  budgetRange.currency  String               default INR
  travelStyle           String               enum: budget|mid-range|luxury|backpacker
  languages             [String]             free text
  travelHistory         [Object]             embedded sub-docs
  reputationScore       Number               0-5, computed from reviews
  totalRatings          Number               count of visible reviews
  isProfileComplete     Boolean              default false
  createdAt             Date       auto
  updatedAt             Date       auto

travelInterests enum values:
  adventure, beach, culture, food, history, nature,
  nightlife, photography, shopping, spiritual, sports, wildlife

travelHistory sub-document (no _id):
  destination  String  required
  visitedOn    Date
  description  String

Indexes: user (unique), isProfileComplete, travelInterests, preferredDestinations,
         budgetRange.min+max (compound), travelStyle, reputationScore desc

Sample:
{
  "user": "ObjectId('64a1b2c3d4e5f6a7b8c9d0e1')",
  "age": 26, "gender": "male",
  "bio": "Adventure lover who enjoys hiking and photography.",
  "location": { "city": "Pune", "country": "India" },
  "travelInterests": ["adventure", "photography", "nature"],
  "preferredDestinations": ["Manali", "Goa", "Ladakh"],
  "budgetRange": { "min": 5000, "max": 20000, "currency": "INR" },
  "travelStyle": "backpacker",
  "languages": ["English", "Hindi"],
  "travelHistory": [{ "destination": "Goa", "visitedOn": "2025-12-20T00:00:00.000Z", "description": "New Year trip" }],
  "reputationScore": 4.5, "totalRatings": 8, "isProfileComplete": true
}

---

## Collection 3 - trips

Purpose: User-created trip plans. Members stored as embedded array.

Fields:
  _id                  ObjectId   auto
  title                String     required  maxlength:150
  description          String               maxlength:1000
  createdBy            ObjectId   required  ref:User
  destination.city     String     required
  destination.country  String     required
  startDate            Date       required
  endDate              Date       required
  budget.min           Number               default 0
  budget.max           Number               default 0
  budget.currency      String               default INR
  interests            [String]             matching tags
  maxMembers           Number               min:2, default:5
  members              [Object]             embedded member sub-docs
  status               String               enum: upcoming|ongoing|completed|cancelled
  coverImage           String               URL
  isPublic             Boolean              default true
  createdAt            Date       auto
  updatedAt            Date       auto

members sub-document (no _id):
  user      ObjectId  ref:User
  joinedAt  Date      default Date.now
  status    String    enum: pending|accepted|rejected

Virtual: memberCount = accepted members + 1 (creator)

Indexes: createdBy, status, destination.city, startDate+endDate (compound),
         isPublic+status (compound), members.user, interests

Sample:
{
  "title": "Ladakh Road Trip 2026",
  "createdBy": "ObjectId('64a1b2c3d4e5f6a7b8c9d0e1')",
  "destination": { "city": "Leh", "country": "India" },
  "startDate": "2026-08-01T00:00:00.000Z",
  "endDate": "2026-08-12T00:00:00.000Z",
  "budget": { "min": 15000, "max": 30000, "currency": "INR" },
  "interests": ["adventure", "photography", "nature"],
  "maxMembers": 6,
  "members": [{ "user": "ObjectId('64a1b2c3d4e5f6a7b8c9d0e4')", "joinedAt": "2026-06-02T09:00:00.000Z", "status": "accepted" }],
  "status": "upcoming", "isPublic": true
}

---

## Collection 4 - messages

Purpose: One-to-one chat. No separate Conversations collection.
         Threads identified by a sorted conversationId string.

Fields:
  _id             ObjectId  auto
  conversationId  String    required  sorted(userId1,userId2).join('_'), indexed
  sender          ObjectId  required  ref:User
  receiver        ObjectId  required  ref:User
  content         String    required  maxlength:1000
  isRead          Boolean             default false
  readAt          Date                set when isRead -> true
  createdAt       Date      auto
  updatedAt       Date      auto

Static helper: Message.getConversationId(id1, id2) - deterministic regardless of argument order

Indexes: conversationId+createdAt desc (compound), sender, receiver+isRead

Sample:
{
  "conversationId": "64a1b2c3d4e5f6a7b8c9d0e1_64a1b2c3d4e5f6a7b8c9d0e4",
  "sender": "ObjectId('64a1b2c3d4e5f6a7b8c9d0e1')",
  "receiver": "ObjectId('64a1b2c3d4e5f6a7b8c9d0e4')",
  "content": "Hey! Want to join my Ladakh trip?",
  "isRead": false, "readAt": null,
  "createdAt": "2026-06-02T10:30:00.000Z"
}

---

## Collection 5 - notifications

Purpose: System and user-triggered notifications with polymorphic document reference.

Fields:
  _id        ObjectId  auto
  recipient  ObjectId  required  ref:User, indexed
  sender     ObjectId            ref:User (null for system notifications)
  type       String    required  enum (see below)
  title      String    required  maxlength:100
  message    String    required  maxlength:300
  refModel   String              enum: Trip|Message|Review|User
  refId      ObjectId            ID of referenced document
  isRead     Boolean             default false, indexed
  readAt     Date
  createdAt  Date      auto
  updatedAt  Date      auto

type enum values:
  new_match, new_message, trip_invite, trip_join,
  trip_update, trip_cancelled, new_review, report_action

Indexes: recipient+isRead+createdAt desc (compound), recipient+type (compound)

Sample:
{
  "recipient": "ObjectId('64a1b2c3d4e5f6a7b8c9d0e1')",
  "sender":    "ObjectId('64a1b2c3d4e5f6a7b8c9d0e4')",
  "type": "new_match",
  "title": "New Travel Match!",
  "message": "Priya Mehta is an 87% match for your Ladakh trip.",
  "refModel": "User", "refId": "ObjectId('64a1b2c3d4e5f6a7b8c9d0e4')",
  "isRead": false
}

---

## Collection 6 - reviews

Purpose: Post-trip ratings and feedback between travelers.

Fields:
  _id        ObjectId   auto
  reviewee   ObjectId   required  ref:User, indexed
  reviewer   ObjectId   required  ref:User
  trip       ObjectId             ref:Trip (optional)
  rating     Number     required  min:1, max:5
  feedback   String               maxlength:800
  tags       [String]             enum (see below)
  isVisible  Boolean              default true (admin can hide)
  createdAt  Date       auto
  updatedAt  Date       auto

tags enum values: friendly, reliable, punctual, fun, responsible, communicative, respectful

Unique constraint: compound (reviewer, reviewee, trip) - one review per pair per trip

Static method: Review.updateReputationScore(revieweeId)
  Aggregates avg rating -> writes reputationScore + totalRatings back to Profile

Indexes: reviewer+reviewee+trip (unique), reviewee+isVisible, rating desc

Sample:
{
  "reviewee": "ObjectId('64a1b2c3d4e5f6a7b8c9d0e1')",
  "reviewer": "ObjectId('64a1b2c3d4e5f6a7b8c9d0e4')",
  "trip": "ObjectId('64a1b2c3d4e5f6a7b8c9d0e3')",
  "rating": 5, "feedback": "Great companion! Very reliable.",
  "tags": ["friendly", "reliable", "fun"], "isVisible": true
}

---

## Collection 7 - reports

Purpose: User-reported misconduct records managed by admin.

Fields:
  _id           ObjectId  auto
  reportedBy    ObjectId  required  ref:User
  reportedUser  ObjectId  required  ref:User
  reason        String    required  enum (see below)
  description   String              maxlength:600
  status        String              enum: pending|reviewed|resolved|dismissed, indexed
  adminNote     String              resolution note
  resolvedBy    ObjectId            ref:User (admin)
  resolvedAt    Date
  createdAt     Date      auto
  updatedAt     Date      auto

reason enum values: harassment, fake_profile, spam, inappropriate_content, scam, other

Indexes: status+createdAt desc (compound), reportedUser, reportedBy

Sample:
{
  "reportedBy": "ObjectId('64a1b2c3d4e5f6a7b8c9d0e4')",
  "reportedUser": "ObjectId('64a1b2c3d4e5f6a7b8c9d0e9')",
  "reason": "fake_profile",
  "description": "User has fake photos and did not show up.",
  "status": "pending", "adminNote": ""
}

---

## Matching Algorithm - Score Breakdown

Logic lives entirely in server/utils/matchingAlgorithm.js (no separate collection).

  Criterion            Weight  Method
  -------------------  ------  ------------------------------------------
  Destination match    35%     Jaccard similarity of preferredDestinations
  Budget overlap       25%     Overlap length / union of [min, max] ranges
  Interest similarity  25%     Jaccard similarity of travelInterests
  Travel date overlap  15%     Day overlap / union of date windows
  Travel style bonus   +5 pts  Exact enum match, final score capped at 100

---

## Full Index Reference

  Collection     Index Fields                                 Type
  -------------- -------------------------------------------- ---------------
  users          email                                        unique
  users          role, isActive, createdAt                    single
  profiles       user                                         unique
  profiles       isProfileComplete, travelInterests,          single
                 preferredDestinations, travelStyle
  profiles       budgetRange.min + budgetRange.max            compound
  profiles       reputationScore                              single
  trips          createdBy, status, destination.city,         single
                 interests
  trips          startDate + endDate                          compound
  trips          isPublic + status                            compound
  trips          members.user                                 single
  messages       conversationId + createdAt                   compound
  messages       sender                                       single
  messages       receiver + isRead                            compound
  notifications  recipient + isRead + createdAt               compound
  notifications  recipient + type                             compound
  reviews        reviewer + reviewee + trip                   unique
  reviews        reviewee + isVisible                         compound
  reviews        rating                                       single
  reports        status + createdAt                           compound
  reports        reportedUser, reportedBy                     single

---

## Relationship Diagram

```
+----------+   1:1    +--------------+
|  users   |----------| profiles     |
+----------+          +--------------+
     |
     | 1:N (createdBy)
     v
+----------+
|  trips   |<---- members[] embedded (M:N with users)
+----------+
     | 1:N
     v
+---------+
| reviews |<---- reviewer/reviewee (M:N with users)
+---------+

users --(sender/receiver)--> messages      (M:N, keyed by conversationId)
users --(recipient)--------> notifications (1:N)
users --(reportedBy/User)--> reports       (M:N)
```