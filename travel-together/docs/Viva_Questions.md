# TRAVEL TOGETHER — VIVA QUESTIONS & ANSWERS
## (50 Questions Covering All Topics)

---

## SECTION 1: PROJECT OVERVIEW (Q1–Q8)

**Q1. What is Travel Together and what problem does it solve?**

Travel Together is a full-stack web application that helps travelers find compatible travel companions. It solves the problem of finding the right travel partner by using a smart matching algorithm that compares users' destinations, budgets, interests, travel style, and dates — producing a compatibility percentage score. It also provides trip discovery, group chat, direct messaging, and a notification system — all in one platform.

---

**Q2. What is the main feature that differentiates Travel Together from other apps?**

The **weighted compatibility matching algorithm** is the key differentiator. Instead of a simple keyword search, Travel Together calculates a score (0–100%) by weighing: destination similarity (35%), budget overlap (25%), interest similarity (25%), travel date overlap (15%), and a travel style bonus (+5). This gives users a quantified measure of compatibility before they decide to connect.

---

**Q3. What are the main modules of the application?**

1. Authentication (Register/Login/JWT)
2. Dashboard (stats + trip discovery)
3. Trip Management (CRUD, join, leave)
4. Ongoing Trips & Upcoming Trips pages
5. Find Travel Buddy (matching + trip search)
6. Trip Detail Modal (info + members + match scores)
7. Direct Messaging (one-to-one chat)
8. Trip Group Chat (per-trip real-time chat)
9. Notifications (real-time bell + history page)
10. Profile Management (4 tabs + completion tracker)
11. Reviews & Ratings
12. Admin Panel (user management, reports)

---

**Q4. Who are the users of this application?**

- **Regular travelers** who want to find companions for trips
- **Trip creators** who post trips and accept members
- **Administrators** who manage the platform, review reports, and handle feedback

---

**Q5. What is the user journey from registration to joining a trip?**

1. Register → JWT issued → Profile auto-created
2. Complete profile (interests, budget, destinations, style)
3. View Dashboard → see ongoing and upcoming public trips
4. Click "Details" on a trip → view trip info and members
5. Click "Join Trip" → system validates (not started, not full, not already joined)
6. User added instantly as accepted member
7. Button changes to "Open Group Chat"
8. Access trip group chat with all members

---

**Q6. What validations are performed before a user can join a trip?**

Three server-side validations in `joinTrip` controller:
1. **Trip started check**: `startDate <= now` → Error: "Sorry, this trip has already started. You can no longer join this trip."
2. **Already member check**: User already in `trip.members` → Error: "Already a member of this trip"
3. **Capacity check**: `acceptedCount + 1 >= maxMembers` → Error: "Slots are full for this trip."

If all pass, user is added with `status: 'accepted'` immediately — no creator approval required.

---

**Q7. How does the application handle real-time updates?**

Through **Socket.IO** (WebSocket protocol):
- Direct messages delivered in real-time to conversation rooms
- Group chat messages emitted to `trip:{id}` rooms
- Notifications pushed to individual users via `emitToUser()`
- Online/offline presence tracked and broadcast
- Typing indicators sent to conversation rooms
- Read receipts updated in DB and sent back to sender

---

**Q8. What happens when a user is offline and receives a message?**

- The message is saved to MongoDB regardless of online status
- If the user is offline, `emitToUser()` finds no sockets and silently skips
- The notification is saved in the Notification collection
- When the user comes back online: `GET /api/notifications` fetches all missed notifications
- A 5-minute polling interval also refreshes unread count as a fallback

---

## SECTION 2: FRONTEND (Q9–Q16)

**Q9. Which frontend framework is used and why?**

**React.js 18** is used because:
- Component-based architecture promotes reusability (e.g., AvatarCircle, TripDetailModal reused in 3 pages)
- Virtual DOM ensures efficient UI updates when match scores or messages arrive
- Large ecosystem (React Router, Context API, Axios)
- SPA architecture eliminates full page reloads
- Hooks (useState, useEffect, useCallback, useRef) provide clean state management

---

**Q10. How is state managed across the application?**

Three Context providers wrap the entire application:
1. **AuthContext** — user info, JWT token, authentication status; uses `useReducer` for predictable state transitions
2. **SocketContext** — socket connection, online users map, helper functions (joinConversation, sendTypingStart, etc.)
3. **NotificationContext** — notification list, unread count, CRUD actions

Local component state uses `useState` for UI-specific data (form values, modal visibility, loading flags).

---

**Q11. How does routing work in Travel Together?**

React Router v6 with nested route layouts:
- **PublicLayout**: Navbar + Footer — wraps unauthenticated pages
- **ProtectedRoute**: Checks `isAuthenticated` — redirects to `/login` if false
- **ProtectedLayout**: Navbar + Sidebar + Outlet — wraps all authenticated pages
- **AdminRoute**: Checks `user.role === 'admin'`

URL params: `useParams()` extracts `userId` from `/chat/:userId` and `tripId` from `/trip-chat/:tripId`.

---

**Q12. How are API calls structured in the frontend?**

All API calls go through a dedicated services layer:
- `services/api.js` creates an Axios instance with `baseURL` from environment variable
- A **request interceptor** automatically adds `Authorization: Bearer <token>` from localStorage to every request
- Each feature has its own service file (tripService, chatService, matchService, etc.)
- `getErrorMessage(err)` extracts clean error text from Axios responses — never exposes raw API data in UI

---

**Q13. What is the TripDetailModal and why is it a shared component?**

TripDetailModal is a reusable React component used in Dashboard, OngoingTrips, and UpcomingTrips pages. It receives `trip`, `myTripIds`, `onClose`, and `onJoined` as props.

It was made shared to avoid **code duplication** — all three pages need to show trip info, member profiles with match scores, and join/group chat actions. Centralizing this logic ensures consistent behavior and makes future changes easier.

---

**Q14. How does the match score ring (SVG circle) work?**

The `ScoreRing` component in FindBuddy.jsx uses an SVG circle with `strokeDasharray`:
```
r = (size - 10) / 2          // radius
circ = 2 × π × r              // full circumference
dash = (score/100) × circ     // filled portion
strokeDasharray = `${dash} ${circ}`
```
The circle is rotated -90° so it starts at the top. A CSS transition on `stroke-dasharray` creates the animation. Color is determined by `classifyScore(score)`.

---

**Q15. How does the typing indicator work?**

1. User types → `sendTypingStart(receiverId)` emits `typing:start` via socket
2. A debounce timer clears after 1.5 seconds → `sendTypingStop(receiverId)` emits `typing:stop`
3. Server broadcasts to the conversation room
4. Receiver's `on('typing:start')` handler sets `typingUsers[userId] = true`
5. JSX renders "typing…" bubble when `typingUsers[selectedUser._id]` is truthy

---

**Q16. What is the `conversationId` and why is it generated this way?**

`conversationId` is a string key that uniquely identifies a conversation between two users. Generated by sorting the two user IDs alphabetically and joining with `_`:

```javascript
[userId1, userId2].sort().join('_')
```

This ensures that whether User A messages User B or User B messages User A, they always reference the **same conversationId** — no separate Conversation document is needed in the database.

---

## SECTION 3: BACKEND (Q17–Q23)

**Q17. What framework is used for the backend and what is its structure?**

**Express.js** on **Node.js 18**. Structure:
- `server.js` — entry point, mounts routes, initializes socket
- `routes/` — 8 route files, each grouping related endpoints
- `controllers/` — business logic, one per domain
- `middleware/` — protect(), validators, errorHandler, rate limiter
- `models/` — Mongoose schemas for all 8 collections
- `utils/` — matchingAlgorithm.js, helpers
- `socket/index.js` — Socket.IO setup with all event handlers
- `config/` — database connection, index creation

---

**Q18. How does the matching algorithm work on the server side?**

The algorithm in `utils/matchingAlgorithm.js` has five pure functions:

1. `scoreDestination(srcDests, candDests)` — Jaccard similarity: intersection/union × 100
2. `scoreBudget(srcBudget, candBudget)` — Range overlap: overlapSpan/unionSpan × 100
3. `scoreInterests(srcInterests, candInterests)` — Jaccard similarity on tag arrays
4. `scoreDateOverlap(filterWindow, candWindow)` — Day overlap ratio (returns 50 neutral if dates missing)
5. `bonusTravelStyle(srcStyle, candStyle)` — Returns 5 if exact match, else 0

Final score = `(dest×0.35 + budget×0.25 + interests×0.25 + dates×0.15) + styleBonus`, capped at 100.

`rankMatches()` scores all candidates and sorts descending by score (reputation as tie-breaker).

---

**Q19. How does the `protect()` middleware work?**

```javascript
const protect = async (req, res, next) => {
  // 1. Extract token from Authorization: Bearer <token>
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return 401 error;

  // 2. Verify JWT
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 3. Fetch user from database
  const user = await User.findById(decoded.id).select('-password');
  if (!user) return 401 error;

  // 4. Attach to request
  req.user = user;
  next();
};
```

---

**Q20. How are notifications sent in real-time?**

`emitToUser(io, userId, event, data)` in `socket/index.js`:
```javascript
const sockets = onlineUsers.get(userId.toString()); // Set of socket IDs
if (!sockets) return; // user offline — notification saved to DB only
for (const sid of sockets) {
  io.to(sid).emit(event, data); // emit to each browser tab
}
```

`onlineUsers` is a `Map<userId, Set<socketId>>` — tracking multiple tabs per user.

---

**Q21. What is the rate limiting configuration?**

```javascript
rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // 10 attempts per IP
  message: { success: false, message: 'Too many attempts...' }
})
```

Applied only to `/api/auth/register` and `/api/auth/login` to prevent brute force attacks.

---

**Q22. How does the `getTripMembers` endpoint work?**

`GET /api/trips/:id/members`:
1. Fetch trip with populated `createdBy` and `members.user`
2. Load requesting user's profile for match calculation
3. Build member list: creator first, then accepted members only
4. For each member: `Profile.findOne({ user: memberId })`
5. If profiles exist for both: `calculateMatchScore(myProfile, memberProfile)`
6. Return array of `{ user, profile, role, matchScore, breakdown }`

---

**Q23. How is the group chat different from direct messaging technically?**

| Aspect | Direct Message | Group Chat |
|---|---|---|
| Model | `Message` collection | `GroupMessage` collection |
| Key | `conversationId` (pair of users) | `trip` ObjectId reference |
| Room | `"userId1_userId2"` | `"trip:{tripId}"` |
| Access | Any two users | Trip members + creator only |
| Socket event | `message:new` | `groupChat:message` |
| Notifications | `new_message` type | `trip_update` type |

---

## SECTION 4: DATABASE (Q24–Q29)

**Q24. Why was MongoDB chosen over a relational database?**

MongoDB was chosen because:
1. **Flexible schema** — travel interests, preferred destinations, and languages are arrays that vary per user
2. **Embedded documents** — trip members are embedded in the Trip document (no join needed)
3. **JSON-native** — natural fit for JavaScript/Node.js ecosystem
4. **Horizontal scaling** — MongoDB Atlas supports sharding for large datasets
5. **Mongoose ODM** — provides schema validation, virtuals, and middleware hooks

---

**Q25. Explain the data model relationships.**

```
User ──1:1──▶ Profile     (profileSchema.user = ObjectId ref User, unique)
User ──1:N──▶ Trip        (tripSchema.createdBy = ObjectId ref User)
Trip ──N:M──▶ User        (members array embedded: [{user, status, joinedAt}])
User ──1:N──▶ Message     (sender + receiver fields, both ref User)
Trip ──1:N──▶ GroupMessage(groupMessageSchema.trip = ObjectId ref Trip)
User ──1:N──▶ Notification(recipient + sender fields, both ref User)
```

---

**Q26. How are conversations stored without a Conversation collection?**

Each `Message` document has a `conversationId` field — a string generated by sorting two user IDs and joining with `_`. For example: `"507f1f77_507f1f78"`. This means A→B and B→A always produce the same ID, so all messages between two users share one `conversationId`. Fetching a conversation is just: `Message.find({ conversationId })`.

---

**Q27. What indexes are used and why?**

| Collection | Index | Reason |
|---|---|---|
| Message | `conversationId` | Fast retrieval of conversation history |
| GroupMessage | `{ trip, createdAt }` | Chronological group message fetch |
| Notification | `recipient` | User-specific notification queries |
| Notification | `isRead` | Fast unread count queries |
| Profile | `user` (unique) | Enforce 1:1 User-Profile relationship |

---

**Q28. Why are members embedded in the Trip document instead of a separate collection?**

Members are embedded because:
1. Members are always accessed WITH the trip (no separate query needed)
2. The list is bounded (maxMembers has a minimum of 2, no unbounded growth)
3. Atomic updates — `trip.members.push()` + `trip.save()` is atomic
4. Simpler queries — `Trip.find({ 'members.user': userId })` works without joins

For very large member lists, a separate collection would be better — but for travel trips (max 20 members), embedded documents are appropriate.

---

**Q29. How does the `memberCount` virtual work?**

In the Trip schema:
```javascript
tripSchema.virtual('memberCount').get(function() {
  return this.members.filter(m => m.status === 'accepted').length + 1;
  // +1 for the creator who is NOT in the members array
});
tripSchema.set('toJSON', { virtuals: true });
```

It's a computed property, not stored in the database. Only counts `accepted` members — pending/rejected are excluded. Setting `toJSON: { virtuals: true }` ensures it appears in API responses.

---

## SECTION 5: AUTHENTICATION & SECURITY (Q30–Q34)

**Q30. How are passwords stored securely?**

Using **bcrypt.js** with a pre-save hook on the User model:
```javascript
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
```
Passwords are hashed with 10 salt rounds before storage. The `password` field has `select: false` so it's excluded from all queries unless explicitly requested.

---

**Q31. What is JWT and how is it used here?**

JSON Web Token (JWT) is a compact, URL-safe token for stateless authentication.

Structure: `header.payload.signature`
- `header`: algorithm (HS256)
- `payload`: `{ id: userId, iat, exp }`
- `signature`: HMAC-SHA256 of header+payload using JWT_SECRET

In Travel Together:
- Generated on login/register with 7-day expiry
- Stored in `localStorage` as `tt_token`
- Sent in every API request: `Authorization: Bearer <token>`
- Verified server-side in `protect()` middleware

---

**Q32. What security measures are implemented?**

1. **Password hashing** — bcrypt, salt rounds 10
2. **JWT expiry** — 7-day token lifetime
3. **Rate limiting** — 10 auth attempts per IP per 15 minutes
4. **CORS whitelist** — only CLIENT_URL allowed
5. **Input validation** — middleware validators on all write endpoints
6. **Mass assignment prevention** — explicit field whitelist in update controllers
7. **NoSQL injection prevention** — Mongoose schema types validate all inputs
8. **Sensitive field exclusion** — `select: false` on password
9. **Role-based access control** — AdminRoute guard on admin pages
10. **Private trip access control** — ownership/membership check in getTripById

---

**Q33. What is CORS and how is it configured?**

CORS (Cross-Origin Resource Sharing) prevents browsers from making requests to a different domain than the page origin.

Configuration in Travel Together:
```javascript
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true  // allows cookies/auth headers
}));
```

Only requests from the configured CLIENT_URL are allowed. The Socket.IO server has matching CORS config.

---

**Q34. How does Socket.IO authentication work?**

Socket.IO connections are authenticated before the `connection` event fires:
```javascript
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication token missing'));
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user) return next(new Error('User not found'));
  socket.user = user;  // attached for use in all handlers
  next();
});
```

The frontend passes the token in `io(URL, { auth: { token } })`.

---

## SECTION 6: APIs, CHAT & NOTIFICATIONS (Q35–Q42)

**Q35. How many API endpoints does Travel Together have?**

Approximately 35+ REST endpoints across 8 route groups:
- `/api/auth`: 5 endpoints (register, login, getMe, updateMe, changePassword, logout)
- `/api/profile`: 7 endpoints (getMe, updateMe, avatar, completion, getById, addHistory, deleteHistory)
- `/api/match`: 4 endpoints (getMatches, getTopMatches, getMatchScore, getFilterOptions)
- `/api/trips`: 10 endpoints (getTrips, getMyTrips, getTripById, getTripMembers, create, update, delete, join, leave, updateMember)
- `/api/chat`: 6 endpoints (getConversations, getMessages, sendMessage, deleteMessage, getUnreadCount, markRead)
- `/api/group-chat`: 3 endpoints (getTripInfo, getMessages, sendMessage)
- `/api/notifications`: 6 endpoints (getAll, getUnreadCount, markOneRead, markAllRead, deleteOne, deleteAllRead)

---

**Q36. What is the difference between the match endpoint and the trip search?**

`GET /api/match` searches **user profiles** — it loads profiles from the database and scores them using the matching algorithm based on travel preferences. Good for finding compatible travel partners by personality.

`GET /api/trips` searches **trip documents** — it queries trips with MongoDB filters (destination regex, date overlap). Good for finding specific planned trips you can join. Both are called in parallel on the Find Buddy page.

---

**Q37. How does the message read receipt work?**

1. User opens a conversation → `GET /api/chat/:userId` marks all unread messages as read in DB
2. User scrolls/views messages → Socket emits `messages:read({ senderId })`
3. Server: `Message.updateMany({ conversationId, receiver: userId, isRead: false }, { isRead: true })`
4. Server: `emitToUser(io, senderId, 'messages:read', { conversationId, readBy: userId })`
5. Sender's chat UI: double tick icon (`bi-check2-all`) appears on their sent messages

---

**Q38. How do you prevent duplicate messages in the chat UI?**

Both REST API response AND Socket.IO event can deliver the same message (race condition). The handler checks:
```javascript
setMessages(prev => {
  if (prev.some(m => m._id === msg._id)) return prev;  // deduplicate
  return [...prev, msg];
});
```
Since MongoDB generates a unique `_id` for each message, comparing `_id` prevents duplicates.

---

**Q39. What notification types exist and what triggers them?**

| Type | Trigger |
|---|---|
| `new_match` | Login welcome + match score ≥ 60 |
| `new_message` | Direct message received |
| `trip_invite` | New public trip created (all users) |
| `trip_join` | User joins your trip |
| `trip_update` | Trip updated / group chat message sent |
| `trip_cancelled` | Trip deleted by creator |
| `new_review` | Someone reviews you |
| `report_action` | Admin takes action on a report |

---

**Q40. How does the notification bell unread count stay accurate?**

Two mechanisms:
1. **Real-time**: Socket listener `on('notification:new')` increments `unreadCount` by 1 instantly
2. **Fallback polling**: `setInterval(fetchUnreadCount, 300_000)` every 5 minutes calls `GET /api/notifications/unread-count`

This two-layer approach ensures the count stays accurate even when the WebSocket reconnects or the page is idle.

---

**Q41. Explain the trip group chat access control.**

In `groupChatController`:
```javascript
const isTripMember = (trip, userId) => {
  if (trip.createdBy.toString() === userId.toString()) return true;
  return trip.members.some(
    m => m.user.toString() === userId.toString() && m.status === 'accepted'
  );
};
```

This function is called at the start of both `getGroupMessages` and `sendGroupMessage`. If the user is not the creator and not an accepted member, they receive a 403 error. Pending members cannot access the chat either.

---

**Q42. How are conversations listed in the chat inbox?**

The `getConversations` controller uses a MongoDB aggregation pipeline:
1. `$match`: messages where user is sender OR receiver
2. `$sort`: by `createdAt` descending
3. `$group`: by `conversationId`, taking the first message (`$first`) as `lastMessage`, summing unread count
4. `$sort`: by `lastMessage.createdAt` descending
5. For each conversation: fetch the other participant's User document

This produces an inbox sorted by most recent activity, similar to WhatsApp.

---

## SECTION 7: ADVANCED TOPICS (Q43–Q50)

**Q43. How does the online presence tracking work?**

Server maintains: `const onlineUsers = new Map<userId, Set<socketId>>`

On socket `connection`:
```javascript
setOnline(userId, socket.id):
  if user was offline → socket.broadcast.emit('user:online', { userId })
```

On socket `disconnect`:
```javascript
setOffline(userId, socket.id):
  remove socketId from Set
  if Set is now empty → socket.broadcast.emit('user:offline', { userId })
```

Using a Set (not a single ID) handles users with multiple browser tabs — a user is only considered offline when ALL their tabs close.

---

**Q44. What is the purpose of `effectiveSource` in rankMatches?**

When a user searches with destination "Goa", the algorithm injects that destination into the source profile:
```javascript
const effectiveSource = filters.destination ? {
  ...sourceProfile.toObject(),
  preferredDestinations: [
    ...sourceProfile.preferredDestinations,
    filters.destination.toLowerCase().trim()
  ]
} : sourceProfile;
```

This allows the destination scorer to match against the searched destination even if the user hasn't saved it in their profile. Without this, searching "Goa" would only work for users who have "Goa" in their `preferredDestinations`.

---

**Q45. Why does `scoreDateOverlap` return 50 when dates are missing?**

50 (neutral) is returned instead of 0 to avoid **penalizing users who haven't set dates**. Since date is worth 15% of the score, returning 0 would unfairly rank users with no travel dates lower than those who have them. A neutral score of 50 treats missing date data as "unknown compatibility" rather than "incompatible".

---

**Q46. How does the profile completion percentage work?**

`getProfileCompletion` controller checks 9 boolean conditions:
```javascript
const checks = {
  age: !!profile.age,
  gender: !!profile.gender,
  bio: !!profile.bio,
  location: !!(profile.location?.city && profile.location?.country),
  travelInterests: profile.travelInterests?.length > 0,
  preferredDestinations: profile.preferredDestinations?.length > 0,
  budgetRange: profile.budgetRange?.max > 0,
  travelStyle: !!profile.travelStyle,
  languages: profile.languages?.length > 0
};
percent = Math.round((trueCount / 9) * 100);
```

The frontend also shows which fields are missing so the user knows what to fill in.

---

**Q47. How are pending members handled in the system?**

The Trip model's member subdocument has `status: ['pending', 'accepted', 'rejected']` with default `'accepted'`. Since the approval workflow was removed:
- All new joins via `POST /api/trips/:id/join` set `status: 'accepted'` directly
- All UI calculations filter `m.status === 'accepted'` for member counts
- `myTripIds` only includes trips where user's membership is `accepted`
- Trip Detail Modal, TripPlanner modal, and all cards only display `accepted` members

The `pending` and `rejected` statuses remain in the schema for potential future use (optional approval toggle feature).

---

**Q48. What happens if two users try to join a trip simultaneously and it has one slot?**

This is a **race condition**. Current implementation:
1. Both users read `acceptedCount = 7` (maxMembers = 8)
2. Both pass the capacity check `7 + 1 < 8`
3. Both push to `trip.members` and call `trip.save()`
4. MongoDB's atomic `save()` with document-level locking ensures one write completes before the other
5. However, both could succeed since they each read the same count before either wrote

**Production solution**: Use MongoDB's `$push` with `$size` condition or a transaction to atomically check-and-update. The current implementation is suitable for low-concurrency development use.

---

**Q49. What is the difference between `getTrips` and `getMyTrips`?**

`GET /api/trips` (getTrips):
- Returns only **public** trips (`isPublic: true`)
- Supports filters: destination, date range, budget
- Used for discovery: Dashboard, OngoingTrips, UpcomingTrips, FindBuddy
- Sorted by `startDate` ascending

`GET /api/trips/my` (getMyTrips):
- Returns trips where `createdBy === userId` OR `members.user === userId`
- No filters — returns ALL trips for the user
- Includes private trips
- Used for: TripPlanner "My Trips" tab, myTripIds building, stats count

---

**Q50. How would you scale this application for 100,000 users?**

1. **Database**: MongoDB Atlas with replica sets + sharding; add Redis for caching match results and session data
2. **Backend**: Horizontal scaling with PM2 cluster mode; load balancer (Nginx) in front of multiple Node instances; Socket.IO Adapter for multi-server socket coordination (socket.io-redis)
3. **Real-time**: Redis Pub/Sub for cross-server socket events
4. **File Storage**: Move avatar uploads from base64 strings to Cloudinary or AWS S3
5. **Notifications**: Message queue (Bull/RabbitMQ) to handle burst notification sends asynchronously
6. **CDN**: Serve static React build via CloudFront or Vercel Edge Network
7. **Matching**: Pre-compute and cache top matches per user; invalidate on profile update
8. **Monitoring**: Add Sentry for error tracking, Datadog for metrics, Winston for structured logging
