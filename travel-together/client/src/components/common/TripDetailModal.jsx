import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import tripService from '../../services/tripService';
import { useAuth } from '../../context/AuthContext';
import { getInitials, formatDate, getErrorMessage } from '../../utils/helpers';

/* ── Helpers ─────────────────────────────────────────── */
const AvatarCircle = ({ name = '', avatar = '', size = 36 }) => {
  if (avatar) {
    return (
      <img src={avatar} alt={name}
        className="rounded-circle object-fit-cover flex-shrink-0"
        width={size} height={size} />
    );
  }
  return (
    <div
      className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center
                 justify-content-center fw-bold text-primary flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.33 }}
    >
      {getInitials(name)}
    </div>
  );
};

/** Classify a score into a label + Bootstrap colour class */
const classifyScore = (score) => {
  if (score >= 90) return { label: 'Excellent Match', cls: 'success',   color: '#198754' };
  if (score >= 75) return { label: 'Good Match',      cls: 'primary',   color: '#0d6efd' };
  if (score >= 60) return { label: 'Moderate Match',  cls: 'warning',   color: '#fd7e14' };
  return            { label: 'Low Match',             cls: 'secondary', color: '#6c757d' };
};

/**
 * TripDetailModal
 *
 * Props:
 *   trip        — the trip object (from the list)
 *   myTripIds   — Set<string> of trip IDs the current user is already in
 *   onClose     — () => void
 *   onJoined    — (tripId) => void   called after a successful join
 */
const TripDetailModal = ({ trip, myTripIds, onClose, onJoined }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [members, setMembers]     = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [membersError, setMembersError]     = useState('');

  const [joining, setJoining]     = useState(false);
  const [joinMsg, setJoinMsg]     = useState({ text: '', type: '' });

  /* ── Derived join-eligibility ──────────────────────── */
  const now           = new Date();
  const tripStarted   = new Date(trip.startDate) <= now;

  const acceptedCount = (trip.members?.filter((m) => m.status === 'accepted').length ?? 0);
  const totalOccupied = acceptedCount + 1; // +1 creator
  const isFull        = totalOccupied >= (trip.maxMembers ?? Infinity);

  const creatorId = trip.createdBy?._id ?? trip.createdBy;
  const isCreator = creatorId?.toString() === user?._id?.toString();
  // Check both the passed myTripIds set AND the trip's own members array (accepted only)
  const isAcceptedMember = trip.members?.some(
    (m) => m.status === 'accepted' && (m.user?._id ?? m.user)?.toString() === user?._id?.toString()
  );
  const alreadyIn = isCreator || isAcceptedMember || myTripIds.has(trip._id);

  /* ── Fetch detailed member list + match scores ──────── */
  /* Only fetch when user is already a member — otherwise 403 would show */
  const fetchMembers = useCallback(async () => {
    if (!alreadyIn) {
      // Not a member yet — show count only, no API call needed
      setLoadingMembers(false);
      return;
    }
    setLoadingMembers(true);
    setMembersError('');
    try {
      const res = await tripService.getTripMembers(trip._id);
      setMembers(res.data?.data ?? []);
    } catch (err) {
      // Show a clean message — never expose raw API text
      setMembersError('Unable to load member details. Please try again.');
    } finally {
      setLoadingMembers(false);
    }
  }, [trip._id, alreadyIn]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  /* ── Join handler ───────────────────────────────────── */
  const handleJoin = async () => {
    setJoining(true);
    setJoinMsg({ text: '', type: '' });
    try {
      await tripService.joinTrip(trip._id);
      setJoinMsg({ text: 'You have successfully joined this trip!', type: 'success' });
      onJoined?.(trip._id);
      // Refresh member list after joining
      fetchMembers();
    } catch (err) {
      setJoinMsg({ text: getErrorMessage(err), type: 'error' });
    } finally {
      setJoining(false);
    }
  };

  /* ── Join button state ──────────────────────────────── */
  const renderJoinButton = () => {
    if (alreadyIn) {
      return (
        <button
          className="btn btn-success"
          onClick={() => { onClose(); navigate(`/trip-chat/${trip._id}`); }}
        >
          <i className="bi bi-chat-dots me-2" />Open Group Chat
        </button>
      );
    }
    if (tripStarted) {
      return (
        <button className="btn btn-secondary" disabled>
          <i className="bi bi-lock me-2" />Trip Already Started
        </button>
      );
    }
    if (isFull) {
      return (
        <button className="btn btn-danger" disabled>
          <i className="bi bi-x-circle me-2" />Trip Full
        </button>
      );
    }
    return (
      <button className="btn btn-primary" onClick={handleJoin} disabled={joining}>
        {joining
          ? <><span className="spinner-border spinner-border-sm me-2" />Joining…</>
          : <><i className="bi bi-person-plus me-2" />Join Trip</>}
      </button>
    );
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
        <div className="modal-content">

          {/* Header */}
          <div className="modal-header">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-map-fill text-success me-2" />
              {trip.title}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">

            {/* Join feedback */}
            {joinMsg.text && (
              <div className={`alert ${joinMsg.type === 'success' ? 'alert-success' : 'alert-danger'} d-flex align-items-center mb-3`}>
                <i className={`bi ${joinMsg.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`} />
                {joinMsg.text}
              </div>
            )}

            {/* Ongoing / Full warnings */}
            {!alreadyIn && tripStarted && (
              <div className="alert alert-warning d-flex align-items-center mb-3">
                <i className="bi bi-exclamation-triangle-fill me-2" />
                Sorry, this trip has already started. You can no longer join this trip.
              </div>
            )}
            {!alreadyIn && !tripStarted && isFull && (
              <div className="alert alert-danger d-flex align-items-center mb-3">
                <i className="bi bi-x-circle-fill me-2" />
                Slots are full for this trip.
              </div>
            )}

            {/* Trip details */}
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <p className="fw-semibold small text-muted mb-1">Destination</p>
                <p className="mb-0">
                  <i className="bi bi-geo-alt me-1 text-success" />
                  {trip.destination?.city ?? '—'}
                  {trip.destination?.country ? `, ${trip.destination.country}` : ''}
                </p>
              </div>
              <div className="col-md-6">
                <p className="fw-semibold small text-muted mb-1">Travel Dates</p>
                <p className="mb-0">
                  <i className="bi bi-calendar3 me-1 text-primary" />
                  {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                </p>
              </div>
              <div className="col-md-6">
                <p className="fw-semibold small text-muted mb-1">Budget</p>
                <p className="mb-0">
                  <i className="bi bi-wallet2 me-1" />
                  {trip.budget?.currency || 'INR'}{' '}
                  {trip.budget?.min?.toLocaleString()} – {trip.budget?.max?.toLocaleString()}
                </p>
              </div>
              <div className="col-md-6">
                <p className="fw-semibold small text-muted mb-1">Capacity</p>
                <p className="mb-0">
                  <i className="bi bi-people me-1" />
                  {totalOccupied} / {trip.maxMembers ?? '∞'} members
                  {!alreadyIn && !tripStarted && !isFull && (
                    <span className="text-success ms-2 small">
                      ({(trip.maxMembers ?? 0) - totalOccupied} slots open)
                    </span>
                  )}
                </p>
              </div>
              {trip.description && (
                <div className="col-12">
                  <p className="fw-semibold small text-muted mb-1">Description</p>
                  <p className="mb-0">{trip.description}</p>
                </div>
              )}
              {trip.interests?.length > 0 && (
                <div className="col-12">
                  <p className="fw-semibold small text-muted mb-1">Interests</p>
                  <div className="d-flex flex-wrap gap-1">
                    {trip.interests.map((i) => (
                      <span key={i} className="badge bg-light text-dark border text-capitalize">{i}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Members with Match Scores ──────────────────── */}
            <hr />
            <h6 className="fw-bold mb-3">
              <i className="bi bi-people-fill text-primary me-2" />
              Trip Members &amp; Compatibility
            </h6>

            {loadingMembers && (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm text-primary" />
                <span className="ms-2 small text-muted">Loading member profiles…</span>
              </div>
            )}

            {membersError && (
              <div className="alert alert-warning small py-2">
                <i className="bi bi-exclamation-triangle me-1" />
                Unable to load member details. Please try again.
              </div>
            )}

            {/* Non-member preview — show basic count without profiles */}
            {!alreadyIn && !loadingMembers && (
              <div className="text-center py-3 text-muted">
                <i className="bi bi-lock fs-4 opacity-50 d-block mb-2" />
                <p className="small mb-1">
                  <strong>{totalOccupied}</strong> member{totalOccupied !== 1 ? 's' : ''} in this trip
                </p>
                <p className="small mb-0">Join the trip to see full member profiles and compatibility scores.</p>
              </div>
            )}

            {!loadingMembers && alreadyIn && !membersError && members.length === 0 && (
              <p className="text-muted small">No member details available.</p>
            )}

            {!loadingMembers && members.map((m, idx) => {
              const isMe = m.user._id?.toString() === user?._id?.toString();
              const { label: scoreLabel, cls: scoreCls, color: scoreColor } = m.matchScore != null
                ? classifyScore(m.matchScore)
                : { label: 'You', cls: 'info', color: '#0dcaf0' };

              return (
                <div
                  key={m.user._id ?? idx}
                  className="border rounded-3 p-3 mb-2 d-flex align-items-start gap-3"
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <AvatarCircle name={m.user.name ?? ''} avatar={m.user.avatar ?? ''} size={48} />
                  </div>

                  {/* Info */}
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                      <span className="fw-semibold">{m.user.name ?? '—'}</span>
                      <span className={`badge bg-${m.role === 'Creator' ? 'success' : 'secondary'}-subtle text-${m.role === 'Creator' ? 'success' : 'secondary'}`}
                        style={{ fontSize: '.65rem' }}>
                        {m.role}
                      </span>
                      {isMe && (
                        <span className="badge bg-info-subtle text-info" style={{ fontSize: '.65rem' }}>You</span>
                      )}
                    </div>

                    {/* Profile details row */}
                    <div className="d-flex flex-wrap gap-3 small text-muted mb-1">
                      {m.profile?.age && (
                        <span><i className="bi bi-person me-1" />Age {m.profile.age}</span>
                      )}
                      {m.profile?.gender && (
                        <span className="text-capitalize">{m.profile.gender}</span>
                      )}
                      {m.profile?.travelStyle && (
                        <span className="text-capitalize">
                          <i className="bi bi-backpack me-1" />{m.profile.travelStyle}
                        </span>
                      )}
                      {m.profile?.location?.city && (
                        <span>
                          <i className="bi bi-geo-alt me-1" />
                          {m.profile.location.city}
                          {m.profile.location.country ? `, ${m.profile.location.country}` : ''}
                        </span>
                      )}
                      {m.profile?.budgetRange?.max > 0 && (
                        <span>
                          <i className="bi bi-wallet2 me-1" />
                          {m.profile.budgetRange.currency || 'INR'}{' '}
                          {m.profile.budgetRange.min?.toLocaleString()}–{m.profile.budgetRange.max?.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Interests */}
                    {m.profile?.travelInterests?.length > 0 && (
                      <div className="d-flex flex-wrap gap-1 mb-1">
                        {m.profile.travelInterests.slice(0, 4).map((interest) => (
                          <span key={interest}
                            className="badge bg-light text-dark border text-capitalize"
                            style={{ fontSize: '.65rem' }}>
                            {interest}
                          </span>
                        ))}
                        {m.profile.travelInterests.length > 4 && (
                          <span className="badge bg-light text-muted border" style={{ fontSize: '.65rem' }}>
                            +{m.profile.travelInterests.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {m.profile?.bio && (
                      <p className="text-muted mb-0" style={{ fontSize: '.8rem' }}>
                        {m.profile.bio.length > 100 ? m.profile.bio.slice(0, 100) + '…' : m.profile.bio}
                      </p>
                    )}
                  </div>

                  {/* Match score + actions */}
                  <div className="flex-shrink-0 text-center d-flex flex-column align-items-center gap-2">
                    {!isMe && m.matchScore != null ? (
                      <>
                        <div
                          className={`border border-2 rounded-circle d-flex flex-column align-items-center
                                      justify-content-center border-${scoreCls}`}
                          style={{ width: 56, height: 56 }}
                          title={`Compatibility: ${scoreLabel}`}
                        >
                          <span className="fw-bold lh-1" style={{ fontSize: '.85rem', color: scoreColor }}>
                            {m.matchScore}%
                          </span>
                          <span style={{ fontSize: '.55rem', color: scoreColor, opacity: .85 }}>
                            {m.matchScore >= 90 ? 'Excellent' : m.matchScore >= 75 ? 'Good' : m.matchScore >= 60 ? 'Moderate' : 'Low'}
                          </span>
                        </div>
                        <span className={`badge bg-${scoreCls} px-2`} style={{ fontSize: '.6rem' }}>
                          {scoreLabel}
                        </span>
                      </>
                    ) : isMe ? (
                      <span className="badge bg-info px-2" style={{ fontSize: '.65rem' }}>You</span>
                    ) : null}

                    {!isMe && (
                      <button
                        className="btn btn-sm btn-outline-primary py-0 px-2"
                        style={{ fontSize: '.7rem' }}
                        onClick={() => { onClose(); navigate(`/chat/${m.user._id}`); }}
                        title={`Message ${m.user.name}`}
                      >
                        <i className="bi bi-chat-dots me-1" />Message
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="modal-footer gap-2">
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
            {renderJoinButton()}
          </div>

        </div>
      </div>
    </div>
  );
};

export default TripDetailModal;
