import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import tripService from '../../services/tripService';
import { useAuth } from '../../context/AuthContext';
import { getInitials, formatDate, getErrorMessage } from '../../utils/helpers';
import TripDetailModal from '../../components/common/TripDetailModal';

const AvatarCircle = ({ name = '', avatar = '', size = 28 }) => {
  if (avatar) {
    return <img src={avatar} alt={name} className="rounded-circle object-fit-cover flex-shrink-0" width={size} height={size} />;
  }
  return (
    <div
      className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center fw-bold text-primary flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {getInitials(name)}
    </div>
  );
};

const OngoingTrips = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [trips, setTrips]         = useState([]);
  const [myTripIds, setMyTripIds] = useState(new Set());
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [joinMsg, setJoinMsg]     = useState({}); // { [tripId]: { text, type } }
  const [joining, setJoining]     = useState(null);

  // Shared detail modal
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showModal, setShowModal]       = useState(false);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const now = new Date();
      const [pubRes, myRes] = await Promise.all([
        tripService.getTrips({ limit: 100 }),
        tripService.getMyTrips(),
      ]);
      const all = pubRes.data?.data ?? [];
      setTrips(all.filter((t) => new Date(t.startDate) <= now && new Date(t.endDate) >= now));
      const myAll = myRes.data?.data ?? [];
      // Only mark as "already in" if accepted member or creator
      const acceptedIds = new Set(
        myAll
          .filter((t) => {
            const creatorId = t.createdBy?._id ?? t.createdBy;
            if (creatorId?.toString() === user?._id?.toString()) return true;
            return t.members?.some(
              (m) => m.status === 'accepted' && (m.user?._id ?? m.user)?.toString() === user?._id?.toString()
            );
          })
          .map((t) => t._id)
      );
      setMyTripIds(acceptedIds);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  // Direct join from card (ongoing trips are blocked by backend + disabled button)
  const handleJoin = async (tripId) => {
    setJoining(tripId);
    setJoinMsg((prev) => ({ ...prev, [tripId]: { text: '', type: '' } }));
    try {
      await tripService.joinTrip(tripId);
      setMyTripIds((prev) => new Set([...prev, tripId]));
      setJoinMsg((prev) => ({ ...prev, [tripId]: { text: 'You have successfully joined this trip!', type: 'success' } }));
      fetchTrips();
    } catch (err) {
      setJoinMsg((prev) => ({ ...prev, [tripId]: { text: getErrorMessage(err), type: 'error' } }));
    } finally {
      setJoining(null);
    }
  };

  return (
    <div className="container-fluid">
      <div className="tt-page-header d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div>
          <h2 className="mb-1"><i className="bi bi-geo-alt-fill text-success me-2" />Ongoing Trips</h2>
          <p className="text-muted mb-0">Trips currently in progress — view details and connect with travelers</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/dashboard" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-1" />Dashboard
          </Link>
          <Link to="/trips?tab=create" className="btn btn-success">
            <i className="bi bi-plus-circle me-1" />Create Trip
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle-fill me-2" />{error}
        </div>
      )}

      {loading && (
        <div className="tt-loader">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading…</span>
          </div>
        </div>
      )}

      {!loading && trips.length === 0 && (
        <div className="card border-0 shadow-sm text-center py-5">
          <i className="bi bi-geo-alt fs-1 text-muted opacity-25 d-block mb-3" />
          <p className="text-muted mb-3">No trips are currently ongoing.</p>
          <Link to="/trips?tab=create" className="btn btn-success mx-auto">
            <i className="bi bi-plus-circle me-2" />Be the first — Create a Trip
          </Link>
        </div>
      )}

      {!loading && trips.length > 0 && (
        <div className="row g-4">
          {trips.map((trip) => {
            const now           = new Date();
            const tripStarted   = new Date(trip.startDate) <= now; // always true for ongoing
            const acceptedCount = trip.members?.filter((m) => m.status === 'accepted').length ?? 0;
            const totalOccupied = acceptedCount + 1;
            const isFull        = totalOccupied >= (trip.maxMembers ?? Infinity);

            const creatorId = trip.createdBy?._id ?? trip.createdBy;
            const isCreator = creatorId?.toString() === user?._id?.toString();
            const isAcceptedMember = trip.members?.some(
              (m) => m.status === 'accepted' && (m.user?._id ?? m.user)?.toString() === user?._id?.toString()
            );
            const alreadyIn = isCreator || isAcceptedMember || myTripIds.has(trip._id);
            const msg       = joinMsg[trip._id];

            return (
              <div key={trip._id} className="col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm h-100 hover-lift">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="fw-bold mb-0 text-truncate me-2">{trip.title}</h5>
                      <span className="badge bg-success flex-shrink-0">Ongoing</span>
                    </div>

                    <p className="text-muted small mb-1">
                      <i className="bi bi-geo-alt me-1" />
                      {trip.destination?.city ?? '—'}
                      {trip.destination?.country ? `, ${trip.destination.country}` : ''}
                    </p>
                    <p className="text-muted small mb-1">
                      <i className="bi bi-calendar3 me-1" />
                      {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                    </p>
                    {trip.budget?.max > 0 && (
                      <p className="text-muted small mb-2">
                        <i className="bi bi-wallet2 me-1" />
                        {trip.budget.currency || 'INR'} {trip.budget.min?.toLocaleString()} – {trip.budget.max?.toLocaleString()}
                      </p>
                    )}
                    {trip.createdBy && (
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <AvatarCircle name={trip.createdBy.name ?? ''} avatar={trip.createdBy.avatar ?? ''} size={24} />
                        <span className="small text-muted">{trip.createdBy.name}</span>
                      </div>
                    )}

                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <span className="small text-muted">
                        <i className="bi bi-people me-1" />
                        {totalOccupied} / {trip.maxMembers ?? '∞'} members
                      </span>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => { setSelectedTrip(trip); setShowModal(true); }}
                      >
                        Details
                      </button>
                    </div>

                    {msg?.text && (
                      <div className={`alert py-1 px-2 small mb-2 ${msg.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
                        {msg.text}
                      </div>
                    )}

                    {/* Action button */}
                    {alreadyIn ? (
                      <button className="btn btn-success w-100" onClick={() => navigate(`/trip-chat/${trip._id}`)}>
                        <i className="bi bi-chat-dots me-2" />Open Group Chat
                      </button>
                    ) : tripStarted ? (
                      /* Problem 1: ongoing — cannot join */
                      <button className="btn btn-secondary w-100" disabled>
                        <i className="bi bi-lock me-2" />Trip Already Started
                      </button>
                    ) : isFull ? (
                      /* Problem 2: capacity reached */
                      <button className="btn btn-danger w-100" disabled>
                        <i className="bi bi-x-circle me-2" />Trip Full
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary w-100"
                        onClick={() => handleJoin(trip._id)}
                        disabled={joining === trip._id}
                      >
                        {joining === trip._id
                          ? <><span className="spinner-border spinner-border-sm me-2" />Joining…</>
                          : <><i className="bi bi-person-plus me-2" />Join Trip</>}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Shared Trip Detail Modal */}
      {showModal && selectedTrip && (
        <TripDetailModal
          trip={selectedTrip}
          myTripIds={myTripIds}
          onClose={() => { setShowModal(false); setSelectedTrip(null); }}
          onJoined={(tripId) => {
            setMyTripIds((prev) => new Set([...prev, tripId]));
            fetchTrips();
          }}
        />
      )}
    </div>
  );
};

export default OngoingTrips;
