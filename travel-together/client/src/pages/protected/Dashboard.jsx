import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import tripService from '../../services/tripService';
import notificationService from '../../services/notificationService';
import { getInitials, formatDate, getErrorMessage } from '../../utils/helpers';
import TripDetailModal from '../../components/common/TripDetailModal';

/* ── Small helper components ─────────────────────────── */
const SectionLoader = () => (
  <div className="tt-loader">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading…</span>
    </div>
  </div>
);

const AvatarCircle = ({ name = '', avatar = '', size = 28 }) => {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="rounded-circle object-fit-cover flex-shrink-0"
        width={size}
        height={size}
      />
    );
  }
  return (
    <div
      className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center fw-bold text-primary flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
};

/* ── Dashboard ───────────────────────────────────────── */
const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats]                 = useState({ myTripCount: 0, unreadCount: 0 });
  const [ongoingTrips, setOngoingTrips]   = useState([]);
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [myTripIds, setMyTripIds]         = useState(new Set());

  const [loadingStats, setLoadingStats]   = useState(true);
  const [loadingPublic, setLoadingPublic] = useState(true);

  const [statsError, setStatsError]       = useState('');
  const [publicError, setPublicError]     = useState('');

  // Trip detail modal
  const [selectedTrip, setSelectedTrip]   = useState(null);
  const [showModal, setShowModal]         = useState(false);
  const [joining, setJoining]             = useState(false);
  const [joinMsg, setJoinMsg]             = useState({ text: '', type: '' }); // type: 'success' | 'error'

  const fetchDashboard = useCallback(async () => {
    const now = new Date();

    // ── Unread notifications count ────────────────────
    setLoadingStats(true);
    try {
      const unreadRes = await notificationService.getUnreadCount();
      setStats((prev) => ({ ...prev, unreadCount: unreadRes.data?.count ?? 0 }));
    } catch (err) {
      setStatsError(getErrorMessage(err));
    } finally {
      setLoadingStats(false);
    }

    // ── My trips — track which trips the user is already in (accepted only)
    try {
      const myRes = await tripService.getMyTrips();
      const myAll = myRes.data?.data ?? [];
      setStats((prev) => ({ ...prev, myTripCount: myAll.length }));
      // Only mark as "already in" if accepted or creator
      const acceptedIds = new Set(
        myAll
          .filter((t) => {
            const creatorId = t.createdBy?._id ?? t.createdBy;
            const isCreator = creatorId?.toString() === user?._id?.toString();
            if (isCreator) return true;
            return t.members?.some(
              (m) => m.status === 'accepted' && (m.user?._id ?? m.user)?.toString() === user?._id?.toString()
            );
          })
          .map((t) => t._id)
      );
      setMyTripIds(acceptedIds);
    } catch {
      // non-critical
    }

    // ── Public community trips ────────────────────────
    setLoadingPublic(true);
    try {
      const res = await tripService.getTrips({ limit: 50 });
      const all = res.data?.data ?? [];
      setOngoingTrips(all.filter((t) => new Date(t.startDate) <= now && new Date(t.endDate) >= now));
      setUpcomingTrips(all.filter((t) => new Date(t.startDate) > now));
    } catch (err) {
      setPublicError(getErrorMessage(err));
    } finally {
      setLoadingPublic(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  /* ── Join trip ─────────────────────────────────────── */
  const handleJoinTrip = async (tripId) => {
    setJoining(true);
    setJoinMsg({ text: '', type: '' });
    try {
      await tripService.joinTrip(tripId);
      setJoinMsg({ text: 'You have successfully joined this trip!', type: 'success' });
      // Update membership set immediately so button switches to "Group Chat"
      setMyTripIds((prev) => new Set([...prev, tripId]));
      fetchDashboard();
    } catch (err) {
      setJoinMsg({ text: getErrorMessage(err), type: 'error' });
    } finally {
      setJoining(false);
    }
  };

  const openModal = (trip) => {
    setSelectedTrip(trip);
    setJoinMsg({ text: '', type: '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedTrip(null);
    setJoinMsg({ text: '', type: '' });
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const statsCards = [
    { label: 'My Trips',        value: loadingStats   ? '—' : stats.myTripCount,      icon: 'bi-map-fill',              colorClass: 'bg-success bg-opacity-10 text-success', link: '/trips'           },
    { label: 'Ongoing Trips',   value: loadingPublic  ? '—' : ongoingTrips.length,    icon: 'bi-geo-alt-fill',          colorClass: 'bg-primary bg-opacity-10 text-primary', link: '/ongoing-trips'   },
    { label: 'Upcoming Trips',  value: loadingPublic  ? '—' : upcomingTrips.length,   icon: 'bi-calendar-event-fill',   colorClass: 'bg-info bg-opacity-10 text-info',       link: '/upcoming-trips'  },
    { label: 'Unread Messages', value: loadingStats   ? '—' : stats.unreadCount,      icon: 'bi-chat-dots-fill',        colorClass: 'bg-warning bg-opacity-10 text-warning', link: '/chat'            },
  ];

  /* Reusable trip card row */
  const TripRow = ({ trip }) => {
    const now           = new Date();
    const tripStarted   = new Date(trip.startDate) <= now;
    const acceptedCount = trip.members?.filter((m) => m.status === 'accepted').length ?? 0;
    const totalOccupied = acceptedCount + 1;
    const isFull        = totalOccupied >= (trip.maxMembers ?? Infinity);

    const creatorId = trip.createdBy?._id ?? trip.createdBy;
    const isCreator = creatorId?.toString() === user?._id?.toString();
    // Accept only members with status === 'accepted'
    const isAcceptedMember = trip.members?.some(
      (m) => m.status === 'accepted' && (m.user?._id ?? m.user)?.toString() === user?._id?.toString()
    );
    const alreadyIn = isCreator || isAcceptedMember || myTripIds.has(trip._id);

    return (
      <div className="border rounded-3 p-3 mb-2">
        <div className="d-flex justify-content-between align-items-start">
          <div className="min-w-0 flex-grow-1 me-2">
            <div className="fw-semibold text-truncate">{trip.title}</div>
            <div className="text-muted small">
              <i className="bi bi-geo-alt me-1" />
              {trip.destination?.city ?? ''}
              {trip.destination?.country ? `, ${trip.destination.country}` : ''}
            </div>
          </div>
          {trip.createdBy && (
            <div className="d-flex align-items-center gap-1 flex-shrink-0">
              <AvatarCircle name={trip.createdBy.name ?? ''} avatar={trip.createdBy.avatar ?? ''} size={24} />
              <span className="text-muted small d-none d-md-inline">{trip.createdBy.name}</span>
            </div>
          )}
        </div>
        <div className="text-muted small mt-1">
          <i className="bi bi-calendar3 me-1" />
          {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
        </div>
        <div className="d-flex align-items-center justify-content-between mt-2 gap-2">
          <div className="text-muted small">
            <i className="bi bi-people me-1" />
            {totalOccupied} / {trip.maxMembers ?? '∞'} members
          </div>
          <div className="d-flex gap-1">
            {/* Details — opens shared modal */}
            <button
              className="btn btn-sm btn-outline-secondary py-0 px-2"
              style={{ fontSize: '0.75rem' }}
              onClick={() => openModal(trip)}
            >
              Details
            </button>

            {alreadyIn ? (
              <button
                className="btn btn-sm btn-success py-0 px-2"
                style={{ fontSize: '0.75rem' }}
                onClick={() => navigate(`/trip-chat/${trip._id}`)}
              >
                <i className="bi bi-chat-dots me-1" />Group Chat
              </button>
            ) : tripStarted ? (
              <button className="btn btn-sm btn-secondary py-0 px-2" style={{ fontSize: '0.75rem' }} disabled>
                <i className="bi bi-lock me-1" />Started
              </button>
            ) : isFull ? (
              <button className="btn btn-sm btn-danger py-0 px-2" style={{ fontSize: '0.75rem' }} disabled>
                Trip Full
              </button>
            ) : (
              <button
                className="btn btn-sm btn-primary py-0 px-2"
                style={{ fontSize: '0.75rem' }}
                onClick={() => handleJoinTrip(trip._id)}
              >
                <i className="bi bi-person-plus me-1" />Join
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid">
      {/* Page header */}
      <div className="tt-page-header d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <h2 className="mb-1">
            {greeting()}, {user?.name?.split(' ')[0] ?? 'Traveller'} 👋
          </h2>
          <p className="text-muted mb-0">Here's what's happening with your travel plans today.</p>
        </div>
        <Link to="/find-buddy" className="btn btn-primary">
          <i className="bi bi-search me-2" />Find a Buddy
        </Link>
      </div>

      {/* Stats row */}
      {statsError && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2" />{statsError}
        </div>
      )}
      <div className="row g-3 mb-4">
        {statsCards.map((card) => (
          <div key={card.label} className="col-6 col-lg-3">
            <Link to={card.link} className="text-decoration-none">
              <div className="card tt-stats-card h-100">
                <div className="card-body d-flex align-items-center gap-3 py-3">
                  <div className={`stats-icon rounded-3 ${card.colorClass}`}>
                    <i className={`bi ${card.icon}`} />
                  </div>
                  <div>
                    <div className="fw-bold fs-4 lh-1">{card.value}</div>
                    <div className="text-muted small mt-1">{card.label}</div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {publicError && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2" />{publicError}
        </div>
      )}

      <div className="row g-4">

        {/* ── Ongoing Trips ── */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center pt-3">
              <h5 className="mb-0 fw-semibold">
                <i className="bi bi-geo-alt-fill text-success me-2" />Ongoing Trips
              </h5>
              {/* Fix: View All links to /ongoing-trips, NOT /trips */}
              <Link to="/ongoing-trips" className="btn btn-sm btn-outline-success">View All</Link>
            </div>
            <div className="card-body">
              {loadingPublic && <SectionLoader />}
              {!loadingPublic && ongoingTrips.length === 0 && (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-geo-alt fs-1 d-block mb-2 opacity-25" />
                  <p className="mb-2 small">No trips currently ongoing.</p>
                  <Link to="/trips?tab=create" className="btn btn-sm btn-success">
                    <i className="bi bi-plus-circle me-1" />Create a Trip
                  </Link>
                </div>
              )}
              {!loadingPublic && ongoingTrips.slice(0, 4).map((trip) => (
                <TripRow key={trip._id} trip={trip} />
              ))}
              {!loadingPublic && ongoingTrips.length > 4 && (
                <Link to="/ongoing-trips" className="btn btn-sm btn-link p-0 text-muted">
                  +{ongoingTrips.length - 4} more ongoing trips
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── Upcoming Trips ── */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center pt-3">
              <h5 className="mb-0 fw-semibold">
                <i className="bi bi-calendar-event-fill text-primary me-2" />Upcoming Trips
              </h5>
              {/* Fix: View All links to /upcoming-trips, NOT /trips */}
              <Link to="/upcoming-trips" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body">
              {loadingPublic && <SectionLoader />}
              {!loadingPublic && upcomingTrips.length === 0 && (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-calendar-event fs-1 d-block mb-2 opacity-25" />
                  <p className="mb-2 small">No upcoming trips yet.</p>
                  <Link to="/trips?tab=create" className="btn btn-sm btn-primary">
                    <i className="bi bi-plus-circle me-1" />Plan a Trip
                  </Link>
                </div>
              )}
              {!loadingPublic && upcomingTrips.slice(0, 4).map((trip) => (
                <TripRow key={trip._id} trip={trip} />
              ))}
              {!loadingPublic && upcomingTrips.length > 4 && (
                <Link to="/upcoming-trips" className="btn btn-sm btn-link p-0 text-muted">
                  +{upcomingTrips.length - 4} more upcoming trips
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ── Find Travel Partners ── */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center pt-3">
              <h5 className="mb-0 fw-semibold">
                <i className="bi bi-people-fill text-primary me-2" />Find Travel Partners
              </h5>
              <Link to="/find-buddy" className="btn btn-sm btn-outline-primary">Find Partners</Link>
            </div>
            <div className="card-body">
              <div className="text-center py-4 text-muted">
                <i className="bi bi-search fs-1 d-block mb-3 opacity-25" />
                <p className="mb-3">Search for travel partners to see matches here.</p>
                <Link to="/find-buddy" className="btn btn-primary">
                  <i className="bi bi-search me-2" />Find Travel Partner
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-transparent border-0 pt-3">
              <h5 className="mb-0 fw-semibold">
                <i className="bi bi-lightning-fill text-warning me-2" />Quick Actions
              </h5>
            </div>
            <div className="card-body d-grid gap-2">
              <Link to="/find-buddy" className="btn btn-outline-primary text-start">
                <i className="bi bi-search me-2" />Find Travel Buddy
              </Link>
              <Link to="/trips?tab=create" className="btn btn-outline-success text-start">
                <i className="bi bi-plus-circle me-2" />Plan a Trip
              </Link>
              <Link to="/chat" className="btn btn-outline-secondary text-start">
                <i className="bi bi-chat-dots me-2" />Messages
                {stats.unreadCount > 0 && (
                  <span className="badge bg-danger ms-2">{stats.unreadCount}</span>
                )}
              </Link>
              <Link to="/profile" className="btn btn-outline-info text-start">
                <i className="bi bi-person-gear me-2" />Edit Profile
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* ── Trip Detail Modal (shared component) ────────────── */}
      {showModal && selectedTrip && (
        <TripDetailModal
          trip={selectedTrip}
          myTripIds={myTripIds}
          onClose={closeModal}
          onJoined={(tripId) => {
            setMyTripIds((prev) => new Set([...prev, tripId]));
            fetchDashboard();
          }}
        />
      )}

    </div>
  );
};

export default Dashboard;
