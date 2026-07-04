# TRAVEL TOGETHER — PROJECT FLOW DOCUMENT

---

## ONE-PAGE USER JOURNEY OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TRAVEL TOGETHER APPLICATION                      │
│              "Find Your Perfect Travel Companion"                   │
└─────────────────────────────────────────────────────────────────────┘

  ╔═══════════════╗
  ║  NEW USER     ║
  ╚═══════╤═══════╝
          │
          ▼
  ┌───────────────┐     ┌─────────────────────────────────────────┐
  │  REGISTER     │     │  Provide: Name, Email, Password         │
  │  /register    │────▶│  System creates: User + empty Profile   │
  └───────┬───────┘     └─────────────────────────────────────────┘
          │
          ▼
  ┌───────────────┐     ┌─────────────────────────────────────────┐
  │  LOGIN        │     │  JWT Token issued → stored in browser   │
  │  /login       │────▶│  Welcome notification created           │
  └───────┬───────┘     │  Redirected to Dashboard                │
          │             └─────────────────────────────────────────┘
          │
          ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │                        DASHBOARD /dashboard                     │
  │  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────┐ │
  │  │  Stats Cards │  │ Ongoing Trips │  │   Upcoming Trips     │ │
  │  │  My Trips    │  │ (live now)    │  │   (future trips)     │ │
  │  │  Ongoing     │  │ View All →    │  │   View All →         │ │
  │  │  Upcoming    │  │ /ongoing-trips│  │   /upcoming-trips    │ │
  │  │  Unread Msgs │  └───────────────┘  └──────────────────────┘ │
  │  └──────────────┘                                               │
  │  ┌──────────────────────────┐  ┌─────────────────────────────┐ │
  │  │  Find Travel Partners    │  │     Quick Actions           │ │
  │  │  → /find-buddy           │  │  Find Buddy / Create Trip   │ │
  │  └──────────────────────────┘  │  Messages / Edit Profile    │ │
  │                                └─────────────────────────────┘ │
  └─────────────────────┬───────────────────────┬───────────────────┘
                        │                       │
          ┌─────────────▼──────┐   ┌────────────▼──────────┐
          │ VIEW ONGOING TRIPS │   │ VIEW UPCOMING TRIPS   │
          │ /ongoing-trips     │   │ /upcoming-trips       │
          │                    │   │                       │
          │ All public trips   │   │ All future public     │
          │ currently active   │   │ trips available       │
          │                    │   │                       │
          │ ┌────────────────┐ │   │ ┌───────────────────┐ │
          │ │ Trip Card:     │ │   │ │ Trip Card:        │ │
          │ │ Title          │ │   │ │ Title             │ │
          │ │ Destination    │ │   │ │ Destination       │ │
          │ │ Dates          │ │   │ │ Dates + Slots     │ │
          │ │ Creator        │ │   │ │ Creator           │ │
          │ │ Members count  │ │   │ │ Interests         │ │
          │ │ [Details] btn  │ │   │ │ [Details] btn     │ │
          │ │ [Started] btn  │ │   │ │ [Join Trip] btn   │ │
          │ │ (disabled)     │ │   │ │ OR [Full] btn     │ │
          │ └────────────────┘ │   │ └───────────────────┘ │
          └─────────┬──────────┘   └───────────┬───────────┘
                    │                           │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────────┐
                    │    TRIP DETAILS MODAL        │
                    │                             │
                    │  ┌─────────────────────┐   │
                    │  │ Trip Information:   │   │
                    │  │ • Destination       │   │
                    │  │ • Travel Dates      │   │
                    │  │ • Budget Range      │   │
                    │  │ • Max Members       │   │
                    │  │ • Description       │   │
                    │  │ • Interests         │   │
                    │  └─────────────────────┘   │
                    │                             │
                    │  ┌─────────────────────┐   │
                    │  │ Members Section:    │   │
                    │  │ (If already joined) │   │
                    │  │ • Creator + Members │   │
                    │  │ • Profile details   │   │
                    │  │ • Match % score     │   │
                    │  │ • [Message] btn     │   │
                    │  │ (If not joined)     │   │
                    │  │ • Member count only │   │
                    │  │ • Join to see all   │   │
                    │  └─────────────────────┘   │
                    │                             │
                    │  [Close] [Join Trip]        │
                    │     OR [Open Group Chat]    │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │         JOIN TRIP            │
                    │                             │
                    │  Validation Checks:         │
                    │  ① Trip not started yet?   │
                    │  ② Slots available?        │
                    │  ③ Not already a member?   │
                    │                             │
                    │  If all pass:               │
                    │  User added as 'accepted'   │
                    │  Notification → Creator     │
                    │  Button → Group Chat        │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │      VIEW TRIP MEMBERS       │
                    │   (GET /trips/:id/members)   │
                    │                             │
                    │  For each member:           │
                    │  • Avatar + Name + Role     │
                    │  • Age, Gender, Location    │
                    │  • Travel Style             │
                    │  • Interests (badges)       │
                    │  • Budget Range             │
                    │  • Bio snippet              │
                    │  • Match Score Ring         │
                    │  • [Message] button         │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │   MATCH PERCENTAGE           │
                    │   CALCULATION               │
                    │                             │
                    │  Algorithm weighs:          │
                    │  Destination    35%         │
                    │  Budget         25%         │
                    │  Interests      25%         │
                    │  Travel Dates   15%         │
                    │  Style Bonus    +5          │
                    │                             │
                    │  ≥90% → Excellent Match     │
                    │  ≥75% → Good Match          │
                    │  ≥60% → Moderate Match      │
                    │  <60% → Low Match           │
                    └──────────────┬──────────────┘
                                   │
          ┌────────────────────────┴─────────────────────────┐
          │                                                   │
          ▼                                                   ▼
  ┌────────────────────┐                    ┌─────────────────────────┐
  │   GROUP CHAT       │                    │   DIRECT MESSAGING      │
  │  /trip-chat/:id    │                    │   /chat/:userId         │
  │                    │                    │                         │
  │  For trip members  │                    │  One-to-one chat        │
  │  only              │                    │  between any users      │
  │                    │                    │                         │
  │  • Real-time msgs  │                    │  • Real-time messages   │
  │  • Sender name +   │                    │  • Typing indicators    │
  │    timestamp       │                    │  • Read receipts        │
  │  • See all members │                    │  • Message history      │
  │  • DM any member   │                    │  • Online status        │
  │  • Group history   │                    │  • Conversation list    │
  └────────────────────┘                    └─────────────────────────┘
          │                                                   │
          └──────────────────────┬────────────────────────────┘
                                 │
                    ┌────────────▼────────────────┐
                    │       NOTIFICATIONS          │
                    │       /notifications         │
                    │                             │
                    │  Auto-generated for:        │
                    │  • Login (Welcome)          │
                    │  • New trip created         │
                    │  • Someone joins your trip  │
                    │  • New direct message       │
                    │  • Group chat message       │
                    │  • Match score ≥ 60%        │
                    │                             │
                    │  Bell icon in navbar shows  │
                    │  unread count in real-time  │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │    PROFILE MANAGEMENT        │
                    │    /profile                  │
                    │                             │
                    │  4 Tabs:                    │
                    │  1. Personal Info           │
                    │     Name, Age, Gender,      │
                    │     Phone, Bio, Location    │
                    │                             │
                    │  2. Travel Interests        │
                    │     Adventure, Beach,       │
                    │     Culture, Food, etc.     │
                    │                             │
                    │  3. Budget & Style          │
                    │     Min/Max Budget,         │
                    │     Travel Style (4 types)  │
                    │                             │
                    │  4. Travel History          │
                    │     Past destinations       │
                    │     Year + Notes            │
                    │                             │
                    │  Completion % progress bar  │
                    │  Avatar upload support      │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │      TRIP COMPLETION         │
                    │                             │
                    │  When endDate passes:       │
                    │  • Trip shows as Completed  │
                    │  • Appears in My Trips      │
                    │    under Completed tab      │
                    │  • Users can leave reviews  │
                    │  • Reputation scores update │
                    └─────────────────────────────┘
```

---

## MODULE-WISE EXPLANATION

### Module 1: Authentication & User Management
- User registers with name, email, password
- Password hashed using bcrypt before storage
- JWT token issued on login/register (7-day expiry)
- Token stored in localStorage as `tt_token`
- Every API call sends token in Authorization header
- `protect()` middleware verifies token on all protected routes
- Admin users have access to additional admin panel routes

### Module 2: Dashboard
- Loads on login, shows personalized greeting (time-based)
- Fetches 3 data streams in parallel: notifications count, my trips, public trips
- Splits public trips into Ongoing (startDate ≤ now ≤ endDate) and Upcoming (startDate > now)
- Stats cards link to relevant pages
- Trip rows show join/group chat buttons based on membership status

### Module 3: Trip Discovery (Ongoing & Upcoming)
- Separate pages for ongoing (`/ongoing-trips`) and upcoming (`/upcoming-trips`)
- Each page fetches all public trips and filters by date range
- Parallel fetch of user's own trips to determine membership
- Button logic: already in → Group Chat, started → disabled, full → disabled, else → Join

### Module 4: Trip Details & Members
- Opens as a modal overlay (no page navigation)
- Shows full trip info: destination, dates, budget, description, interests
- If user is a member: fetches full member profiles + match scores via `GET /trips/:id/members`
- If not a member: shows count only with "Join to see profiles" message
- Match scores calculated server-side using the matching algorithm

### Module 5: Trip Join Flow
- Backend validates: trip not started, user not already member, slots available
- On success: member added with `status: 'accepted'` (no approval needed)
- Notification sent to trip creator via socket in real-time
- Frontend immediately updates button state and member count

### Module 6: Matching Algorithm
- Runs server-side in `utils/matchingAlgorithm.js`
- Compares two Profile documents using Jaccard similarity for destinations and interests
- Budget scored by range overlap ratio
- Travel date overlap scored by intersection/union ratio
- Style bonus is a flat +5 for exact match
- Used in: Find Buddy search, Trip member compatibility display

### Module 7: Find Travel Buddy
- Search form with filters: destination, dates, budget, style, gender, interests, min score
- Two parallel searches: buddy match (`/match`) + trip search (`/trips?destination=`)
- Trip results show with status badges, slot counts, Connect buttons
- Buddy results show match score rings with category labels
- Empty state shows "Create Trip" CTA

### Module 8: Direct Messaging
- One-to-one chat between any two users
- `conversationId` = sorted pair of user IDs (no separate Conversation document needed)
- Messages stored in MongoDB Message collection
- Socket.IO handles real-time delivery, typing indicators, read receipts
- Conversations list shows last message preview and unread count badge

### Module 9: Trip Group Chat
- Separate GroupMessage collection per trip
- Only accepted trip members + creator can access
- Socket joins `trip:{id}` room on page load
- All members see messages in real-time
- Members sidebar shows all participants with DM buttons
- Message history loads on entry

### Module 10: Notification System
- Notification documents stored in MongoDB
- Real-time delivery via `emitToUser()` on socket connection
- Bell icon in Navbar shows unread count (refreshes every 5 minutes + real-time updates)
- Notification page has filter tabs: All, Unread, Matches, Messages, Trips
- Click on notification navigates to relevant page
- Bulk actions: Mark all read, Clear read notifications

### Module 11: Profile Management
- Profile document linked 1:1 with User document
- `travelInterests` stored as enum array (12 categories)
- `preferredDestinations` used for matching algorithm
- `budgetRange` with min/max/currency
- `travelStyle` enum: budget / mid-range / luxury / backpacker
- Completion percentage calculated from 9 profile fields
- Name update also updates User document via `PUT /auth/me`

### Module 12: Admin Panel
- Only accessible to users with `role: 'admin'`
- User Management: view/ban/unban all users
- Reported Users: review flagged accounts
- Feedback Management: view ratings and reviews

---

## TECHNOLOGY INTERACTION MAP

```
  User Browser
      │
      ├── React SPA (create-react-app)
      │       ├── React Router v6 (navigation)
      │       ├── Bootstrap 5 (styling)
      │       ├── Bootstrap Icons (icons)
      │       ├── Axios (HTTP requests)
      │       ├── Socket.IO Client (real-time)
      │       └── Context API (state: Auth, Socket, Notification)
      │
      │  HTTP/HTTPS (REST API)
      │  WebSocket (Socket.IO)
      │
      ├── Node.js + Express Server
      │       ├── JWT Auth Middleware
      │       ├── CORS Middleware
      │       ├── Route Handlers (8 route groups)
      │       ├── Controllers (business logic)
      │       ├── Matching Algorithm (pure functions)
      │       └── Socket.IO Server
      │
      └── MongoDB (Atlas / Local)
              ├── Users
              ├── Profiles
              ├── Trips
              ├── Messages
              ├── GroupMessages
              ├── Notifications
              ├── Reviews
              └── Reports
```
