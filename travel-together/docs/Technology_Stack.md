# TRAVEL TOGETHER — TECHNOLOGY STACK DOCUMENT

---

## 1. FRONTEND TECHNOLOGY

### Framework
| Technology | Version | Purpose |
|---|---|---|
| React.js | 18.x | Core UI framework (SPA) |
| Create React App | 5.x | Project scaffolding & build toolchain |

### Routing
| Technology | Purpose |
|---|---|
| React Router DOM v6 | Client-side routing, protected routes, nested layouts |

React Router features used:
- `BrowserRouter` — HTML5 history API
- `Routes` + `Route` — declarative routing
- `Navigate` — programmatic redirect
- `useParams` — extract URL params (userId, tripId)
- `useNavigate` — imperative navigation
- `useSearchParams` — query string management (tab=create)
- `useLocation` — redirect after login (from state)
- Nested routes with `Outlet` — layout components (PublicLayout, ProtectedLayout, AdminLayout)

### UI & Styling
| Technology | Version | Purpose |
|---|---|---|
| Bootstrap 5 | 5.x | CSS framework — grid, components, utilities |
| Bootstrap Icons | 1.x | SVG icon library (bi-* classes) |
| Custom CSS | — | App-specific variables, animations, component styles |

Bootstrap components used: Cards, Badges, Modals, Nav Tabs, Pills, Progress Bars, Alerts, Buttons, Forms, Spinners, Pagination, Dropdowns, Breadcrumbs

Custom CSS classes: `.tt-navbar`, `.tt-sidebar`, `.tt-stats-card`, `.tt-bubble-sent`, `.tt-bubble-recv`, `.tt-score-ring`, `.tt-loader`, `.hover-lift`

### State Management
| Approach | Tool | Used For |
|---|---|---|
| Global State | React Context API | Auth, Socket, Notifications |
| Local State | useState + useReducer | Component-level UI state |
| Side Effects | useEffect + useCallback | Data fetching, subscriptions |
| Refs | useRef | DOM access (scroll, input focus) |

**AuthContext** — manages: `user`, `token`, `isAuthenticated`, `isLoading`, `profile`
Actions: `login`, `register`, `logout`, `loadUser`, `updateProfile`, `updateUser`, `updateAvatar`
Reducer pattern with `useReducer` for predictable state transitions

**SocketContext** — manages: `socket`, `isConnected`, `onlineUsers`
Exposes: `on`, `off`, `emit`, `joinConversation`, `leaveConversation`, `joinTripChat`, `leaveTripChat`, `sendTypingStart`, `sendTypingStop`, `markMessagesRead`, `checkOnlineStatus`

**NotificationContext** — manages: `notifications`, `unreadCount`
Exposes: `fetchNotifications`, `markOneRead`, `markAllRead`, `deleteOne`, `deleteAllRead`

### HTTP Client
| Technology | Purpose |
|---|---|
| Axios | HTTP requests with interceptors, base URL config |

Axios instance (`services/api.js`) configured with:
- `baseURL` from `REACT_APP_API_URL` environment variable
- Request interceptor — automatically attaches Bearer token from localStorage

### Real-time Communication
| Technology | Purpose |
|---|---|
| Socket.IO Client | WebSocket connection to backend |

Connection configured with:
- JWT auth token passed in `socket.handshake.auth.token`
- Auto-reconnect (5 attempts, 1s delay)
- Transports: websocket + polling fallback

### Services Layer (API Abstraction)
All HTTP calls go through dedicated service files:

| Service File | API Base | Key Methods |
|---|---|---|
| `authService` | `/auth` | login, register, logout |
| `profileService` | `/profile` | getMyProfile, updateMyProfile, addTravelHistory |
| `matchService` | `/match` | getMatches, getTopMatches, getMatchScore, getFilterOptions |
| `tripService` | `/trips` | getTrips, getMyTrips, getTripById, getTripMembers, joinTrip, leaveTrip |
| `chatService` | `/chat` | getConversations, getMessages, sendMessage, markConversationRead |
| `groupChatService` | `/group-chat` | getTripInfo, getMessages, sendMessage |
| `notificationService` | `/notifications` | getUnreadCount |

### Utility Functions (`utils/helpers.js`)
- `formatDate(iso)` — locale-formatted date strings
- `getInitials(name)` — avatar fallback initials
- `classifyScore(score)` — match score label + color
- `formatBudget(range)` — compact budget display (K/L notation)
- `truncate(str, maxLen)` — text truncation with ellipsis
- `getErrorMessage(err)` — clean error extraction from Axios errors

### Validation (`utils/validators.js`)
- `validateEmail`, `validateRequired`, `validateName`
- `runValidations` — batch validation runner

---

## 2. BACKEND TECHNOLOGY

### Runtime & Framework
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18.x LTS | JavaScript runtime |
| Express.js | 4.x | Web application framework |

### API Architecture
**REST API** with JSON request/response bodies.

API base path: `/api`

Route groups:
| Route | Controller | Description |
|---|---|---|
| `/api/auth` | authController | Register, login, logout, get me, change password, update name |
| `/api/profile` | profileController | CRUD profile, avatar, travel history, completion |
| `/api/match` | matchController | Buddy matching with filters and scoring |
| `/api/trips` | tripController | Trip CRUD, discovery, join/leave, members |
| `/api/chat` | chatController | DM conversations, messages, read receipts |
| `/api/group-chat` | groupChatController | Trip group messages |
| `/api/notifications` | notificationController | Notification CRUD and read management |
| `/api/reviews` | reviewController | User/trip reviews and ratings |
| `/api/admin` | adminController | User management, reports, feedback |

### Authentication
| Technology | Purpose |
|---|---|
| JSON Web Tokens (JWT) | Stateless authentication tokens |
| bcrypt.js | Password hashing (salt rounds: 10) |

JWT flow:
1. User registers/logs in
2. Server generates token: `jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' })`
3. Client stores token in `localStorage`
4. Client sends token in every request: `Authorization: Bearer <token>`
5. `protect()` middleware decodes and attaches `req.user`

Password security:
- Passwords never stored in plain text
- `user.matchPassword(plain)` method on User model uses `bcrypt.compare`
- Password field excluded from all queries by default (`select: false`)

### Middleware
| Middleware | Purpose |
|---|---|
| `cors` | Cross-origin resource sharing (CLIENT_URL whitelist) |
| `express.json` | JSON body parsing (10mb limit for base64 images) |
| `express-rate-limit` | 10 auth attempts per 15 minutes per IP |
| `protect` | JWT verification on all protected routes |
| `errorHandler` | Centralised error response formatting |
| `validateMatchQuery` | Query param validation for match search |
| `validateUpdateProfile` | Body validation for profile update |

### Real-time (Socket.IO Server)
| Feature | Socket Event | Direction |
|---|---|---|
| User presence | `user:online` / `user:offline` | Server → All clients |
| Online status check | `users:status` | Client → Server (callback) |
| DM room join/leave | `conversation:join` / `:leave` | Client → Server |
| Trip chat room | `tripChat:join` / `:leave` | Client → Server |
| Send DM | `message:send` | Client → Server (callback) |
| Receive DM | `message:new` | Server → Room clients |
| Group message | `groupChat:message` | Server → Trip room |
| Typing indicator | `typing:start` / `:stop` | Bidirectional |
| Read receipt | `messages:read` | Client → Server → Sender |
| New notification | `notification:new` | Server → Specific user |

Socket authentication: JWT token verified in `io.use()` middleware before any connection is established. Unauthenticated connections are rejected.

### Server-side Business Logic

**Matching Algorithm** (`utils/matchingAlgorithm.js`):
- `scoreDestination` — Jaccard similarity on destination arrays
- `scoreBudget` — Overlap ratio on [min, max] numeric ranges
- `scoreInterests` — Jaccard similarity on interest tag arrays
- `scoreDateOverlap` — Day-level overlap/union ratio (neutral 50 if missing)
- `bonusTravelStyle` — Flat +5 for exact style match
- `calculateMatchScore` — Weighted composite scorer
- `rankMatches` — Batch scorer + descending sort by score

**Trip Join Validation** (`tripController.joinTrip`):
1. Trip exists check
2. Creator self-join block
3. Trip started check (startDate ≤ now → 400)
4. Already member check
5. Capacity check (acceptedCount + 1 ≥ maxMembers → 400)
6. Add as `accepted` member
7. Notify creator via socket

---

## 3. DATABASE TECHNOLOGY

### Database System
| Technology | Details |
|---|---|
| MongoDB | NoSQL document database |
| Mongoose | ODM (Object Document Mapper) for Node.js |
| MongoDB Atlas | Cloud-hosted database (or local MongoDB for development) |

### Collections / Schema Design

**Users** (`models/User.js`)
```
{
  name:        String (required, trim)
  email:       String (required, unique, lowercase)
  password:    String (hashed, select:false)
  avatar:      String (URL)
  role:        Enum ['user', 'admin']  default: 'user'
  isActive:    Boolean  default: true
  lastLogin:   Date
  createdAt:   Date (auto)
  updatedAt:   Date (auto)
}
```

**Profiles** (`models/Profile.js`)
```
{
  user:                 ObjectId → User (unique)
  age:                  Number (18–100)
  gender:               Enum ['male','female','non-binary','prefer not to say']
  phone:                String
  bio:                  String (max 500)
  location:             { city: String, country: String }
  travelInterests:      [String] (enum, 12 categories)
  preferredDestinations:[String]
  budgetRange:          { min: Number, max: Number, currency: String }
  travelStyle:          Enum ['budget','mid-range','luxury','backpacker']
  languages:            [String]
  travelHistory:        [{ destination, visitedOn, description }]
  reputationScore:      Number (0–5)
  totalRatings:         Number
}
```

**Trips** (`models/Trip.js`)
```
{
  title:       String (required, max 150)
  description: String (max 1000)
  createdBy:   ObjectId → User
  destination: { city: String (required), country: String }
  startDate:   Date (required)
  endDate:     Date (required)
  budget:      { min, max, currency }
  interests:   [String]
  maxMembers:  Number (min 2, default 5)
  members:     [{ user: ObjectId, joinedAt, status: 'accepted' }]
  status:      Enum ['upcoming','ongoing','completed','cancelled']
  isPublic:    Boolean (default true)
  coverImage:  String
}
Virtual: memberCount = accepted.length + 1
```

**Messages** (`models/Message.js`)
```
{
  conversationId: String (indexed) — sorted pair of userIds: "id1_id2"
  sender:         ObjectId → User
  receiver:       ObjectId → User
  content:        String (max 1000)
  isRead:         Boolean (default false)
  readAt:         Date
}
Static: Message.getConversationId(a, b) → sorted join
```

**GroupMessages** (`models/GroupMessage.js`)
```
{
  trip:    ObjectId → Trip (indexed)
  sender:  ObjectId → User
  content: String (max 1000)
  createdAt, updatedAt
}
Index: { trip, createdAt } compound
```

**Notifications** (`models/Notification.js`)
```
{
  recipient: ObjectId → User (indexed)
  sender:    ObjectId → User
  type:      Enum [new_match, new_message, trip_invite, trip_join,
                   trip_update, trip_cancelled, new_review, report_action]
  title:     String (max 100)
  message:   String (max 300)
  refModel:  Enum ['Trip','Message','Review','User']
  refId:     ObjectId
  isRead:    Boolean (indexed)
  readAt:    Date
}
```

**Reviews** (`models/Review.js`) — Reviewer → Reviewed user, rating 1–5, comment

**Reports** (`models/Report.js`) — Reporter → Reported user, reason, status

### Relationships
```
User ──────1:1──────▶ Profile
User ──────1:N──────▶ Trip (createdBy)
Trip ──────N:M──────▶ User (members array embedded)
User ──────1:N──────▶ Message (as sender/receiver)
Trip ──────1:N──────▶ GroupMessage
User ──────1:N──────▶ Notification (as recipient/sender)
User ──────1:N──────▶ Review (as reviewer/reviewed)
User ──────1:N──────▶ Report (as reporter/reported)
```

### Indexing Strategy
- `Message.conversationId` — indexed for fast conversation queries
- `GroupMessage.{trip, createdAt}` — compound index for chronological fetch
- `Notification.recipient` — indexed for user-specific queries
- `Notification.isRead` — indexed for unread count queries
- `Match.users` — unique index for pair deduplication
- `Profile.user` — unique index (1:1 relationship)

### Data Flow
```
Client Request
     │
     ▼
Express Route → Middleware (protect, validate)
     │
     ▼
Controller (req, res, next)
     │
     ├── Mongoose Query (.find, .findById, .create, .findByIdAndUpdate)
     │        │
     │        ▼
     │   MongoDB Atlas
     │        │
     │        ▼
     │   Mongoose Document
     │
     ├── Business Logic (matching algorithm, validations)
     │
     ├── Socket.IO Emit (real-time notifications)
     │
     └── JSON Response { success, data, count, message }
```

---

## 4. ADDITIONAL TOOLS & SERVICES

### Development Tools
| Tool | Purpose |
|---|---|
| VS Code | Primary code editor |
| Postman | API testing and documentation |
| MongoDB Compass | Database GUI for inspection |
| Git | Version control |
| GitHub | Remote repository hosting |
| npm | Package management (frontend + backend) |
| nodemon | Auto-restart server on file changes |
| concurrently | Run frontend + backend simultaneously |

### Environment Configuration
```
Backend (.env):
  PORT              — Express server port (5000)
  MONGO_URI         — MongoDB connection string
  JWT_SECRET        — Token signing secret
  JWT_EXPIRES_IN    — Token lifetime (7d)
  CLIENT_URL        — Frontend URL for CORS

Frontend (.env):
  REACT_APP_API_URL      — Backend API base URL
  REACT_APP_SOCKET_URL   — Socket.IO server URL
```

### Package Dependencies

**Backend (package.json)**
```
Production:
  express           — Web framework
  mongoose          — MongoDB ODM
  jsonwebtoken      — JWT token generation/verification
  bcryptjs          — Password hashing
  cors              — Cross-origin headers
  dotenv            — Environment variable loading
  socket.io         — WebSocket server
  express-rate-limit— Brute force protection

Dev:
  nodemon           — Development auto-restart
```

**Frontend (package.json)**
```
Production:
  react              — UI framework
  react-dom          — DOM rendering
  react-router-dom   — Client-side routing
  axios              — HTTP client
  socket.io-client   — WebSocket client
  bootstrap          — CSS framework
  bootstrap-icons    — Icon library

Dev:
  react-scripts      — Build toolchain (CRA)
```

### Deployment Considerations
| Layer | Option | Notes |
|---|---|---|
| Frontend | Vercel / Netlify / GitHub Pages | Static build (`npm run build`) |
| Backend | Render / Railway / Heroku / VPS | Node.js process |
| Database | MongoDB Atlas | Free tier (512MB) or paid |
| File Storage | Cloudinary / AWS S3 | For avatar images (currently base64) |

### Security Measures Implemented
1. **Password Hashing** — bcrypt with 10 salt rounds
2. **JWT Expiry** — 7-day token lifetime
3. **Rate Limiting** — 10 auth attempts per IP per 15 minutes
4. **CORS Whitelist** — Only CLIENT_URL allowed
5. **Input Validation** — Middleware validators on all write endpoints
6. **Mass Assignment Prevention** — Explicit field whitelist in update controllers
7. **SQL/NoSQL Injection Prevention** — Mongoose schema validation
8. **Sensitive Field Protection** — `select: false` on password field
9. **Admin Route Guard** — Role-based access control on admin routes
10. **Private Trip Access** — Ownership check on non-public trips
