import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import groupChatService from '../../services/groupChatService';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { getInitials, getErrorMessage } from '../../utils/helpers';

/* ── Avatar helper ──────────────────────────────────── */
const Avatar = ({ name = '', avatar = '', size = 36 }) => {
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
      className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center
                 justify-content-center fw-bold text-primary flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.32 }}
    >
      {getInitials(name)}
    </div>
  );
};

/* ── TripGroupChat page ─────────────────────────────── */
const TripGroupChat = () => {
  const { tripId } = useParams();
  const { user: currentUser } = useAuth();
  const { on, off, joinTripChat, leaveTripChat } = useSocket();
  const navigate = useNavigate();

  const [trip, setTrip]               = useState(null);
  const [messages, setMessages]       = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading]         = useState(true);
  const [sending, setSending]         = useState(false);
  const [error, setError]             = useState('');
  const [membersOpen, setMembersOpen] = useState(false);

  const messagesEndRef  = useRef(null);
  const inputRef        = useRef(null);

  /* ── Load trip info + messages ────────────────────── */
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [infoRes, msgRes] = await Promise.all([
        groupChatService.getTripInfo(tripId),
        groupChatService.getMessages(tripId, { limit: 50 }),
      ]);
      setTrip(infoRes.data?.data);
      setMessages(msgRes.data?.data ?? []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ── Join / leave socket room ─────────────────────── */
  useEffect(() => {
    if (!tripId) return;
    joinTripChat(tripId);
    return () => leaveTripChat(tripId);
  }, [tripId, joinTripChat, leaveTripChat]);

  /* ── Real-time incoming messages ─────────────────── */
  useEffect(() => {
    const handler = (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };
    const cleanup = on('groupChat:message', handler);
    return () => { typeof cleanup === 'function' ? cleanup() : off('groupChat:message', handler); };
  }, [on, off]);

  /* ── Scroll to bottom on new messages ────────────── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Send message ─────────────────────────────────── */
  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setSending(true);
    try {
      const res = await groupChatService.sendMessage(tripId, { content: messageText.trim() });
      const newMsg = res.data?.data;
      setMessages((prev) => {
        if (prev.some((m) => m._id === newMsg._id)) return prev;
        return [...prev, newMsg];
      });
      setMessageText('');
      inputRef.current?.focus();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  /* ── Members list ─────────────────────────────────── */
  const allMembers = trip ? [
    { user: trip.createdBy, role: 'Creator' },
    ...(trip.members ?? [])
      .filter((m) => m.status === 'accepted')
      .map((m) => ({ user: m.user, role: 'Member' })),
  ] : [];

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    );
  }

  if (error && !trip) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger mt-4">
          <i className="bi bi-exclamation-triangle-fill me-2" />{error}
          <div className="mt-2">
            <Link to="/trips" className="btn btn-outline-secondary btn-sm">
              <i className="bi bi-arrow-left me-1" />Back to Trips
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      <div
        className="d-flex flex-column"
        style={{ height: 'calc(100vh - var(--tt-navbar-height) - 1rem)' }}
      >
        {/* ── Chat Header ───────────────────────────── */}
        <div className="bg-white border-bottom px-3 py-2 d-flex align-items-center gap-3 flex-shrink-0">
          <button
            className="btn btn-link text-muted p-0 me-1"
            onClick={() => navigate('/trips')}
            title="Back to trips"
          >
            <i className="bi bi-arrow-left fs-5" />
          </button>

          <div
            className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center
                       justify-content-center flex-shrink-0"
            style={{ width: 42, height: 42 }}
          >
            <i className="bi bi-map-fill text-success" />
          </div>

          <div className="flex-grow-1 min-w-0">
            <h6 className="mb-0 fw-bold text-truncate">{trip?.title ?? 'Trip Group Chat'}</h6>
            <small className="text-muted">
              <i className="bi bi-geo-alt me-1" />
              {trip?.destination?.city ?? ''}
              {trip?.destination?.country ? `, ${trip.destination.country}` : ''}
              {trip?.startDate && (
                <span className="ms-2">
                  <i className="bi bi-calendar3 me-1" />
                  {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                </span>
              )}
            </small>
          </div>

          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setMembersOpen((o) => !o)}
            title="View members"
          >
            <i className="bi bi-people me-1" />
            {allMembers.length}
          </button>
        </div>

        <div className="d-flex flex-grow-1 overflow-hidden">
          {/* ── Messages area ─────────────────────── */}
          <div className="d-flex flex-column flex-grow-1 overflow-hidden">
            <div className="flex-grow-1 overflow-auto p-3 bg-light">
              {error && (
                <div className="alert alert-danger alert-dismissible mb-3">
                  <i className="bi bi-exclamation-triangle-fill me-2" />{error}
                  <button className="btn-close" onClick={() => setError('')} />
                </div>
              )}

              {messages.length === 0 && (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-chat-dots fs-1 opacity-25 d-block mb-3" />
                  <p className="small">No messages yet. Start the group conversation!</p>
                </div>
              )}

              {messages.map((msg, idx) => {
                const senderId = msg.sender?._id ?? msg.sender;
                const isMine   = senderId?.toString() === currentUser?._id?.toString();
                const senderName = msg.sender?.name ?? 'Unknown';

                return (
                  <div
                    key={msg._id ?? idx}
                    className={`d-flex mb-3 ${isMine ? 'justify-content-end' : 'justify-content-start'}`}
                  >
                    {!isMine && (
                      <Avatar name={senderName} avatar={msg.sender?.avatar ?? ''} size={32} />
                    )}
                    <div className={`ms-2 ${isMine ? 'me-0' : ''}`} style={{ maxWidth: '70%' }}>
                      {!isMine && (
                        <div className="small fw-semibold text-muted mb-1 ms-1">{senderName}</div>
                      )}
                      <div className={isMine ? 'tt-bubble-sent' : 'tt-bubble-recv'}>
                        <div>{msg.content}</div>
                        <div
                          className={`small mt-1 ${isMine ? 'text-white-50' : 'text-muted'}`}
                          style={{ fontSize: '.68rem' }}
                        >
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Message input ──────────────────── */}
            <div className="p-3 border-top bg-white flex-shrink-0">
              <form onSubmit={handleSend} className="d-flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  className="form-control"
                  placeholder="Type a message to the group…"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={sending}
                  maxLength={1000}
                />
                <button
                  type="submit"
                  className="btn btn-success px-4"
                  disabled={!messageText.trim() || sending}
                >
                  {sending
                    ? <span className="spinner-border spinner-border-sm" />
                    : <i className="bi bi-send-fill" />}
                </button>
              </form>
            </div>
          </div>

          {/* ── Members sidebar ─────────────────── */}
          {membersOpen && (
            <div
              className="border-start bg-white flex-shrink-0 overflow-auto"
              style={{ width: 240 }}
            >
              <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-bold">
                  <i className="bi bi-people-fill me-2 text-success" />
                  Members ({allMembers.length})
                </h6>
                <button
                  className="btn btn-link text-muted p-0"
                  onClick={() => setMembersOpen(false)}
                >
                  <i className="bi bi-x-lg" />
                </button>
              </div>
              <div className="p-2">
                {allMembers.map(({ user: member, role }, idx) => (
                  <div
                    key={member?._id ?? idx}
                    className="d-flex align-items-center gap-2 p-2 rounded hover-bg"
                  >
                    <Avatar name={member?.name ?? ''} avatar={member?.avatar ?? ''} size={32} />
                    <div className="flex-grow-1 min-w-0">
                      <div className="small fw-semibold text-truncate">{member?.name ?? '—'}</div>
                      <div className="text-muted" style={{ fontSize: '.7rem' }}>{role}</div>
                    </div>
                    {member?._id?.toString() !== currentUser?._id?.toString() && (
                      <button
                        className="btn btn-sm btn-outline-primary py-0 px-1"
                        style={{ fontSize: '.7rem' }}
                        onClick={() => navigate(`/chat/${member._id}`)}
                        title="Direct message"
                      >
                        <i className="bi bi-chat-dots" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripGroupChat;
