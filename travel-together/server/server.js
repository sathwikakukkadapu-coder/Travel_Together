const http    = require('http');
const express = require('express');
const cors    = require('cors');
const dotenv  = require('dotenv');

const connectDB     = require('./config/db');
const ensureIndexes = require('./config/indexes');
const errorHandler  = require('./middleware/errorHandler');
const { initSocket } = require('./socket');

dotenv.config();

// Connect DB then ensure all indexes exist
connectDB().then(ensureIndexes).catch((err) => {
  console.error('Startup error:', err.message);
});

const app = express();

// ─── Core Middleware ──────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// ─── API Routes ───────────────────────────────────────────
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/profile',       require('./routes/profileRoutes'));
app.use('/api/match',         require('./routes/matchRoutes'));
app.use('/api/trips',         require('./routes/tripRoutes'));
app.use('/api/chat',          require('./routes/chatRoutes'));
app.use('/api/group-chat',    require('./routes/groupChatRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/reviews',       require('./routes/reviewRoutes'));
app.use('/api/admin',         require('./routes/adminRoutes'));

// Health check
app.get('/api/health', (_req, res) =>
  res.json({ status: 'OK', time: new Date(), env: process.env.NODE_ENV })
);

// ─── 404 for unknown API routes ───────────────────────────
app.use('/api/*', (_req, res) =>
  res.status(404).json({ success: false, message: 'API endpoint not found' })
);

// ─── Central Error Handler (must be last) ─────────────────
app.use(errorHandler);

// ─── HTTP + Socket.IO ─────────────────────────────────────
const httpServer = http.createServer(app);
initSocket(httpServer);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () =>
  console.log(`✓ Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`)
);
