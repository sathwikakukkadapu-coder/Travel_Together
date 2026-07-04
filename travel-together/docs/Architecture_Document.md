# TRAVEL TOGETHER — ARCHITECTURE DOCUMENT

---

## 1. HIGH-LEVEL ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TRAVEL TOGETHER SYSTEM ARCHITECTURE                 │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────────────────┐
  │                         CLIENT TIER (Browser)                            │
  │                                                                          │
  │  ┌──────────────────────────────────────────────────────────────────┐   │
  │  │                    React.js Single Page Application              │   │
  │  │                                                                  │   │
  │  │  ┌────────────┐  ┌────────────┐  ┌───────────────────────────┐  │   │
  │  │  │   Pages    │  │ Components │  │       Contexts            │  │   │
  │  │  │ Dashboard  │  │ Navbar     │  │  AuthContext              │  │   │
  │  │  │ FindBuddy  │  │ Sidebar    │  │  SocketContext            │  │   │
  │  │  │ TripPlanner│  │ TripDetail │  │  NotificationContext      │  │   │
  │  │  │ Chat       │  │   Modal    │  └───────────────────────────┘  │   │
  │  │  │ Profile    │  │ AdminRoute │                                  │   │
  │  │  │ Notifs     │  │ ProtRoute  │  ┌───────────────────────────┐  │   │
  │  │  │ OngoingT.  │  └────────────┘  │       Services            │  │   │
  │  │  │ UpcomingT. │                  │  tripService              │  │   │
  │  │  │ TripGroup  │                  │  chatService              │  │   │
  │  │  │   Chat     │                  │  matchService             │  │   │
  │  │  │ Admin/*    │                  │  profileService           │  │   │
  │  │  └────────────┘                  │  notificationService      │  │   │
  │  │                                  │  groupChatService         │  │   │
  │  │  ┌──────────────────────────┐    └───────────────────────────┘  │   │
  │  │  │     React Router v6      │                                    │   │
  │  │  │  Public / Protected /    │                                    │   │
  │  │  │  Admin route layouts     │                                    │   │
  │  │  └──────────────────────────┘                                    │   │
  │  └──────────────────────────────────────────────────────────────────┘   │
  └─────────────────────┬────────────────────────┬────────────────────────-─┘
                        │                        │
              HTTP REST API              WebSocket (Socket.IO)
              (Axios + JWT)              (Bidirectional events)
                        │                        │
  ┌─────────────────────▼────────────────────────▼────────────────────────-─┐
  │                        SERVER TIER (Node.js)                             │
  │                                                                          │
  │  ┌─────────────────────────────────────────────────────────────────┐    │
  │  │                    Express.js Application                       │    │
  │  │                                                                 │    │
  │  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │    │
  │  │  │  Middleware  │  │   Routes     │  │     Controllers        │ │    │
  │  │  │  cors        │  │  /auth       │  │  authController        │ │    │
  │  │  │  json parser │  │  /profile    │  │  profileController     │ │    │
  │  │  │  rate limit  │  │  /match      │  │  matchController       │ │    │
  │  │  │  protect()   │  │  /trips      │  │  tripController        │ │    │
  │  │  │  validators  │  │  /chat       │  │  chatController        │ │    │
  │  │  │  errorHandler│  │  /group-chat │  │  groupChatController   │ │    │
  │  │  └─────────────┘  │  /notifs     │  │  notificationController│ │    │
  │  │                   │  /reviews    │  │  reviewController      │ │    │
  │  │  ┌─────────────┐  │  /admin      │  └────────────────────────┘ │    │
  │  │  │  Utilities  │  └──────────────┘                             │    │
  │  │  │ matchingAlg.│                   ┌────────────────────────┐  │    │
  │  │  │ helpers     │                   │    Socket.IO Server     │  │    │
  │  │  └─────────────┘                   │  Auth middleware        │  │    │
  │  │                                   │  Online user tracking   │  │    │
  │  │                                   │  DM rooms              │  │    │
  │  │                                   │  Trip chat rooms       │  │    │
  │  │                                   │  Typing indicators     │  │    │
  │  │                                   │  Notification emitter  │  │    │
  │  │                                   └────────────────────────┘  │    │
  │  └─────────────────────────────────────────────────────────────────┘    │
  └─────────────────────────────────────┬──────────────────────────────────-┘
                                        │
                               Mongoose ODM
                                        │
  ┌─────────────────────────────────────▼──────────────────────────────────-─┐
  │                        DATA TIER (MongoDB)                                │
  │                                                                           │
  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
  │  │  Users   │  │ Profiles │  │  Trips   │  │ Messages │  │GroupMsgs │  │
  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
  │                                                                           │
  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                               │
  │  │  Notifs  │  │ Reviews  │  │ Reports  │                               │
  │  └──────────┘  └──────────┘  └──────────┘                               │
  └────────────────────────────────────────────────────────────────────────-─┘
```

---

## 2. FRONTEND → BACKEND → DATABASE FLOW

```
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  Example: User searches for travel buddies                              │
  └─────────────────────────────────────────────────────────────────────────┘

  1. User fills search form in FindBuddy.jsx
     └── handleSearch() called

  2. Frontend: Two parallel Axios calls
     ├── GET /api/match?destination=Goa&minScore=40
     └── GET /api/trips?destination=Goa

  3. Axios request interceptor adds header:
     Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

  4. Express routes match:
     ├── router.get('/', validateMatchQuery, getMatches)
     └── router.get('/', getTrips)

  5. protect() middleware:
     ├── Extracts token from header
     ├── jwt.verify(token, JWT_SECRET)
     ├── User.findById(decoded.id)
     └── req.user = user document

  6. getMatches controller:
     ├── Profile.findOne({ user: req.user._id })
     │   → MongoDB: db.profiles.findOne({ user: ObjectId("...") })
     │
     ├── Profile.find({ user: { $ne: userId }, ...filters })
     │   → MongoDB: db.profiles.find({ ... })
     │   → Returns candidate profiles
     │
     ├── rankMatches(sourceProfile, candidates, filters)
     │   ├── For each candidate: calculateMatchScore()
     │   │   ├── scoreDestination (Jaccard) × 0.35
     │   │   ├── scoreBudget (overlap) × 0.25
     │   │   ├── scoreInterests (Jaccard) × 0.25
     │   │   ├── scoreDateOverlap × 0.15
     │   │   └── bonusTravelStyle + 5
     │   └── Sort descending by score
     │
     └── res.json({ success: true, data: rankedResults })

  7. Frontend receives response:
     ├── setMatches(res.data.data)
     ├── setSearched(true)
     └── Renders match cards with score rings

  ┌─────────────────────────────────────────────────────────────────────────┐
  │  Database Query Pattern (Mongoose → MongoDB Wire Protocol)              │
  ├─────────────────────────────────────────────────────────────────────────┤
  │  Mongoose Call                 │ MongoDB Operation                      │
  │  Profile.findOne({user: id})   │ db.profiles.findOne({user: ObjectId}) │
  │  Trip.find({isPublic: true})   │ db.trips.find({isPublic: true})       │
  │  Trip.create({...})            │ db.trips.insertOne({...})             │
  │  Trip.findByIdAndUpdate(id,..) │ db.trips.findOneAndUpdate(...)        │
  │  Message.aggregate([...])      │ db.messages.aggregate([...])          │
  └─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. AUTHENTICATION FLOW

```
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                        REGISTRATION FLOW                                │
  └─────────────────────────────────────────────────────────────────────────┘

  User fills form → POST /api/auth/register
          │
          ▼
  validateRegister middleware
  (name ≥ 2 chars, valid email, password ≥ 8)
          │
          ▼
  User.findByEmail(email) → duplicate check
          │
          ▼
  User.create({ name, email, password })
  → pre('save') hook: password = bcrypt.hash(password, 10)
          │
          ▼
  Profile.create({ user: user._id }) — empty profile
          │
          ▼
  generateToken(user._id) → jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' })
          │
          ▼
  Response: { success, token, user: { _id, name, email, avatar, role } }
          │
          ▼
  Frontend: AuthContext dispatches LOGIN_SUCCESS
  localStorage.setItem('tt_token', token)
  navigate('/dashboard')

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                           LOGIN FLOW                                    │
  └─────────────────────────────────────────────────────────────────────────┘

  POST /api/auth/login → { email, password }
          │
          ▼
  User.findByEmail(email, includePassword=true)
          │
          ▼
  user.matchPassword(password) → bcrypt.compare(plain, hash)
          │
      ┌───┴───┐
     NO      YES
      │       │
  401 Error  user.isActive check
              │
          ┌───┴───┐
         NO      YES
          │       │
      403 Error  user.lastLogin = new Date()
                  │
                  ▼
                Create welcome Notification (once per 24h)
                  │
                  ▼
                generateToken → Response with token + user

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                    PROTECTED REQUEST FLOW                               │
  └─────────────────────────────────────────────────────────────────────────┘

  Any request to /api/* (except /auth/register, /auth/login)
          │
          ▼
  protect() middleware
          │
          ▼
  Extract token from Authorization header
          │
          ▼
  jwt.verify(token, process.env.JWT_SECRET)
          │
      ┌───┴───┐
   INVALID   VALID
      │         │
  401 Error   decoded.id
                │
                ▼
  User.findById(decoded.id).select('-password')
                │
            ┌───┴───┐
         NOT       FOUND
        FOUND        │
           │       req.user = user
       401 Error     │
                     ▼
                  next() → Controller
```

---

## 4. CHAT SYSTEM FLOW

```
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                     DIRECT MESSAGE FLOW                                 │
  └─────────────────────────────────────────────────────────────────────────┘

  User A opens /chat/userB_id
       │
       ├── REST: GET /api/chat/:userBId
       │   ├── getConvId(A, B) = [A,B].sort().join('_') → "A_B"
       │   ├── Message.find({ conversationId: "A_B" })
       │   │   .sort({ createdAt: -1 }).limit(30)
       │   ├── Mark unread messages as read
       │   └── Return messages array + participant info
       │
       └── Socket: emit('conversation:join', userBId)
           └── Server: socket.join("A_B") room
       │
  User A types message
       │
       ├── Socket: emit('message:send', { receiverId, content }, callback)
       │   │
       │   └── Server socket handler:
       │       ├── Message.create({ conversationId, sender, receiver, content })
       │       ├── message.populate('sender', 'name avatar')
       │       ├── io.to("A_B").emit('message:new', msgPayload)  ← room
       │       ├── emitToUser(io, receiverId, 'message:new', msgPayload)  ← direct
       │       ├── Notification.create({ type: 'new_message', ... })
       │       ├── emitToUser(io, receiverId, 'notification:new', notif)
       │       └── callback({ success: true, data: msgPayload })
       │
  User B receives
       └── Socket listener: on('message:new', handler)
           └── setMessages(prev => [...prev, msg])

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                     GROUP CHAT FLOW                                     │
  └─────────────────────────────────────────────────────────────────────────┘

  Member navigates to /trip-chat/:tripId
       │
       ├── REST: GET /api/group-chat/:tripId
       │   └── Verify membership → return trip info + members
       │
       ├── REST: GET /api/group-chat/:tripId/messages
       │   └── GroupMessage.find({ trip: tripId }).sort.limit → history
       │
       └── Socket: emit('tripChat:join', tripId)
           └── Server: socket.join('trip:tripId')
       │
  Member sends message
       │
       └── REST: POST /api/group-chat/:tripId/messages
           │
           └── Server:
               ├── Verify membership
               ├── GroupMessage.create({ trip, sender, content })
               ├── message.populate('sender', 'name avatar')
               ├── io.to('trip:tripId').emit('groupChat:message', msg)
               ├── For each other member:
               │   ├── Notification.create({ type: 'trip_update', ... })
               │   └── emitToUser(io, memberId, 'notification:new', notif)
               └── Response: { success, data: message }

  All members receive
       └── Socket listener: on('groupChat:message', handler)
           └── setMessages(prev => [...prev, msg])

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                   CONVERSATION ID GENERATION                            │
  └─────────────────────────────────────────────────────────────────────────┘

  getConversationId(userId1, userId2):
  → [userId1.toString(), userId2.toString()].sort().join('_')

  Example:
  User A: "64a1b2c3d4e5f6a7b8c9d0e1"
  User B: "54a1b2c3d4e5f6a7b8c9d0e2"

  sort() → ["54a...e2", "64a...e1"]
  join('_') → "54a1b2c3d4e5f6a7b8c9d0e2_64a1b2c3d4e5f6a7b8c9d0e1"

  This ensures A→B and B→A always map to the same conversation document.
```

---

## 5. NOTIFICATION FLOW

```
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                    NOTIFICATION CREATION & DELIVERY                     │
  └─────────────────────────────────────────────────────────────────────────┘

  Trigger Event
       │
       ▼
  Controller creates notification:
  Notification.create({
    recipient: targetUserId,
    sender:    sourceUserId,
    type:      'new_message' | 'trip_join' | 'trip_invite' | etc.,
    title:     "Human readable title",
    message:   "Human readable body",
    refModel:  'Trip' | 'Message' | 'User',
    refId:     relatedDocumentId
  })
       │
       ▼
  Real-time: emitToUser(io, targetUserId, 'notification:new', notif)
       │
       ├── onlineUsers.get(userId) → Set of socket IDs
       └── io.to(socketId).emit('notification:new', notif) × each tab
       │
       ▼
  Client: NotificationContext.on('notification:new', handler)
  → setNotifications(prev => [notif, ...prev])
  → setUnreadCount(c => c + 1)
       │
       ▼
  Navbar bell badge updates immediately
       │
       ▼
  User clicks /notifications
  → GET /api/notifications?limit=50
  → Renders filtered list with tabs

  ┌─────────────────────────────────────────────────────────────────────────┐
  │              NOTIFICATION TYPE → ACTION MAPPING                        │
  └─────────────────────────────────────────────────────────────────────────┘

  new_match     → navigate('/find-buddy')
  new_message   → navigate('/chat/:senderId')
  trip_invite   → navigate('/trips')
  trip_join     → navigate('/trips')
  trip_update   → navigate('/trips')
  trip_cancelled→ navigate('/trips')
  new_review    → navigate('/reviews')
  report_action → navigate('/notifications')

  ┌─────────────────────────────────────────────────────────────────────────┐
  │              FALLBACK POLLING (when socket disconnects)                 │
  └─────────────────────────────────────────────────────────────────────────┘

  NotificationContext sets interval:
  setInterval(fetchUnreadCount, 300_000)  // every 5 minutes
  → GET /api/notifications/unread-count
  → setUnreadCount(res.data.count)
```

---

## 6. TRIP MATCHING FLOW

```
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                    MATCH SCORE CALCULATION FLOW                         │
  └─────────────────────────────────────────────────────────────────────────┘

  Input: sourceProfile + candidateProfile

  Step 1: scoreDestination
  ┌────────────────────────────────────────────────────────┐
  │  Source destinations:    ['goa', 'manali', 'kerala']   │
  │  Candidate destinations: ['goa', 'ladakh', 'manali']   │
  │                                                        │
  │  Normalise (lowercase + trim)                          │
  │  setA = {goa, manali, kerala}                         │
  │  setB = {goa, ladakh, manali}                         │
  │                                                        │
  │  intersection = {goa, manali} → 2                     │
  │  union = {goa, manali, kerala, ladakh} → 4            │
  │  score = 2/4 × 100 = 50                               │
  └────────────────────────────────────────────────────────┘

  Step 2: scoreBudget
  ┌────────────────────────────────────────────────────────┐
  │  Source budget:    min=10000, max=30000                │
  │  Candidate budget: min=20000, max=50000               │
  │                                                        │
  │  overlapStart = max(10000, 20000) = 20000             │
  │  overlapEnd   = min(30000, 50000) = 30000             │
  │  overlapSpan  = 30000 - 20000 = 10000                 │
  │  unionSpan    = 50000 - 10000 = 40000                 │
  │  score = 10000/40000 × 100 = 25                       │
  └────────────────────────────────────────────────────────┘

  Step 3: scoreInterests
  ┌────────────────────────────────────────────────────────┐
  │  Source:    {adventure, beach, culture, food}          │
  │  Candidate: {adventure, nature, food, photography}     │
  │                                                        │
  │  intersection = {adventure, food} → 2                 │
  │  union = {adventure, beach, culture, food,             │
  │           nature, photography} → 6                    │
  │  score = 2/6 × 100 = 33                               │
  └────────────────────────────────────────────────────────┘

  Step 4: scoreDateOverlap
  ┌────────────────────────────────────────────────────────┐
  │  Filter window: 2025-03-01 to 2025-03-15              │
  │  Candidate trip: 2025-03-10 to 2025-03-25             │
  │                                                        │
  │  overlapStart = max(Mar 1, Mar 10) = Mar 10           │
  │  overlapEnd   = min(Mar 15, Mar 25) = Mar 15          │
  │  overlapMs    = 5 days                                │
  │  unionMs      = 24 days                               │
  │  score = 5/24 × 100 = 21                              │
  └────────────────────────────────────────────────────────┘

  Step 5: bonusTravelStyle
  ┌────────────────────────────────────────────────────────┐
  │  Source style:    'budget'                             │
  │  Candidate style: 'budget'                            │
  │  bonus = 5 (exact match)                              │
  └────────────────────────────────────────────────────────┘

  Final Calculation:
  ┌────────────────────────────────────────────────────────┐
  │  weighted = 50×0.35 + 25×0.25 + 33×0.25 + 21×0.15   │
  │           = 17.5 + 6.25 + 8.25 + 3.15                │
  │           = 35.15                                     │
  │  total = min(100, round(35.15 + 5)) = 40             │
  │  Label: Moderate Match                                │
  └────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                  DESTINATION INJECTION FOR SEARCH                       │
  └─────────────────────────────────────────────────────────────────────────┘

  When user searches with destination "Goa":
  effectiveSource = {
    ...sourceProfile,
    preferredDestinations: [
      ...sourceProfile.preferredDestinations,
      "goa"  // injected from search filter
    ]
  }

  This ensures the searched destination contributes to the score
  even if the user hasn't listed it in their profile.
  All candidates are ranked — no hard MongoDB destination filter.
```

---

## 7. COMPONENT ARCHITECTURE (Frontend)

```
  App.jsx (Router)
  │
  ├── PublicLayout (Navbar + Footer)
  │   ├── Home, About, Contact
  │   ├── Login, Register
  │   └── ForgotPassword
  │
  ├── ProtectedRoute (auth guard)
  │   └── ProtectedLayout (Navbar + Sidebar + Outlet)
  │       ├── Dashboard
  │       ├── Profile
  │       ├── FindBuddy
  │       ├── TripPlanner
  │       ├── Chat (+ /chat/:userId)
  │       ├── TripGroupChat (/trip-chat/:tripId)
  │       ├── OngoingTrips
  │       ├── UpcomingTrips
  │       ├── Notifications
  │       └── Reviews
  │
  └── AdminRoute (role guard)
      └── AdminLayout
          ├── AdminDashboard
          ├── UserManagement
          ├── ReportedUsers
          └── FeedbackManagement

  Shared Components:
  ├── Navbar (notification bell, user dropdown)
  ├── Sidebar (navigation links, logout)
  ├── Loader (spinner)
  ├── TripDetailModal (shared across Dashboard, OngoingTrips, UpcomingTrips)
  ├── AdminRoute (role-based guard)
  └── ProtectedRoute (auth guard)

  Context Providers (wrapping entire app):
  AuthProvider → SocketProvider → NotificationProvider → Router
```

---

## 8. ERROR HANDLING ARCHITECTURE

```
  Backend:
  ┌────────────────────────────────────────────────────────┐
  │  Controller throws / returns error                     │
  │        │                                               │
  │        ▼                                               │
  │  next(error)                                           │
  │        │                                               │
  │        ▼                                               │
  │  errorHandler middleware                               │
  │  → Mongoose ValidationError → 400                     │
  │  → JWT TokenExpiredError   → 401                     │
  │  → CastError (bad ObjectId)→ 404                     │
  │  → Duplicate key (11000)   → 409                     │
  │  → Default                 → 500                     │
  │  → Response: { success: false, message: "..." }       │
  └────────────────────────────────────────────────────────┘

  Frontend:
  ┌────────────────────────────────────────────────────────┐
  │  Axios error caught in try/catch                       │
  │        │                                               │
  │        ▼                                               │
  │  getErrorMessage(err)                                  │
  │  → err.response.data.message (backend message)        │
  │  → err.message (network error)                        │
  │  → "Something went wrong" (fallback)                  │
  │        │                                               │
  │        ▼                                               │
  │  setError(message) → renders in alert component       │
  │  Never exposes stack traces or API URLs               │
  └────────────────────────────────────────────────────────┘
```
