import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout  from './components/layout/PublicLayout';
import ProtectedLayout from './components/layout/ProtectedLayout';
import AdminLayout   from './components/layout/AdminLayout';

// Route guards
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute     from './components/common/AdminRoute';

// ── Public page placeholders (pages generated separately) ─────────────────
import Home     from './pages/public/Home';
import About    from './pages/public/About';
import Contact  from './pages/public/Contact';
import Login    from './pages/public/Login';
import Register from './pages/public/Register';
import ForgotPassword from './pages/public/ForgotPassword';

// ── Protected page placeholders ────────────────────────────────────────────
import Dashboard   from './pages/protected/Dashboard';
import Profile     from './pages/protected/Profile';
import FindBuddy   from './pages/protected/FindBuddy';
import TripPlanner from './pages/protected/TripPlanner';
import Chat        from './pages/protected/Chat';
import Notifications from './pages/protected/Notifications';
import Reviews     from './pages/protected/Reviews';
import TripGroupChat from './pages/protected/TripGroupChat';
import OngoingTrips  from './pages/protected/OngoingTrips';
import UpcomingTrips from './pages/protected/UpcomingTrips';

// ── Admin page placeholders ────────────────────────────────────────────────
import AdminDashboard    from './pages/admin/AdminDashboard';
import UserManagement    from './pages/admin/UserManagement';
import ReportedUsers     from './pages/admin/ReportedUsers';
import FeedbackManagement from './pages/admin/FeedbackManagement';

// ── Not Found ───────────────────────────────────────────────────────────────
import NotFound from './pages/public/NotFound';

function App() {
  return (
    <Router>
      <Routes>

        {/* ── Public routes — wrapped in Navbar + Footer ───────── */}
        <Route element={<PublicLayout />}>
          <Route path="/"         element={<Home />} />
          <Route path="/about"    element={<About />} />
          <Route path="/contact"  element={<Contact />} />
          <Route path="/login"            element={<Login />} />
          <Route path="/register"         element={<Register />} />
          <Route path="/forgot-password"  element={<ForgotPassword />} />
        </Route>

        {/* ── Protected routes — wrapped in Sidebar layout ────── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard"    element={<Dashboard />} />
            <Route path="/profile"      element={<Profile />} />
            <Route path="/find-buddy"   element={<FindBuddy />} />
            <Route path="/trips"        element={<TripPlanner />} />
            <Route path="/chat"           element={<Chat />} />
            <Route path="/chat/:userId"  element={<Chat />} />
            <Route path="/trip-chat/:tripId"  element={<TripGroupChat />} />
            <Route path="/ongoing-trips"      element={<OngoingTrips />} />
            <Route path="/upcoming-trips"     element={<UpcomingTrips />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/reviews"      element={<Reviews />} />
          </Route>
        </Route>

        {/* ── Admin routes — admin sidebar layout ─────────────── */}
        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin"            element={<AdminDashboard />} />
            <Route path="/admin/users"      element={<UserManagement />} />
            <Route path="/admin/reported"   element={<ReportedUsers />} />
            <Route path="/admin/feedback"   element={<FeedbackManagement />} />
          </Route>
        </Route>

        {/* ── Catch-all ──────────────────────────────────────── */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </Router>
  );
}

export default App;
