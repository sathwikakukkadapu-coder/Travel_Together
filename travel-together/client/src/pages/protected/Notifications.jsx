import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { getErrorMessage } from '../../utils/helpers';

// ── Config: icon + colour + label per type ────────────────────────────────────
const TYPE_META = {
  new_match:      { icon: 'bi-people-fill',      bg: 'bg-primary bg-opacity-10',   text: 'text-primary', label: 'Match'    },
  new_message:    { icon: 'bi-chat-dots-fill',   bg: 'bg-success bg-opacity-10',   text: 'text-success', label: 'Message'  },
  trip_invite:    { icon: 'bi-send-fill',        bg: 'bg-info bg-opacity-10',      text: 'text-info',    label: 'Trip Invite' },
  trip_join:      { icon: 'bi-person-plus-fill', bg: 'bg-info bg-opacity-10',      text: 'text-info',    label: 'Trip'     },
  trip_update:    { icon: 'bi-calendar2-check',  bg: 'bg-warning bg-opacity-10',   text: 'text-warning', label: 'Trip Update' },
  trip_cancelled: { icon: 'bi-x-circle-fill',   bg: 'bg-danger bg-opacity-10',    text: 'text-danger',  label: 'Cancelled' },
  new_review:     { icon: 'bi-star-fill',        bg: 'bg-warning bg-opacity-10',   text: 'text-warning', label: 'Review'   },
  report_action:  { icon: 'bi-shield-exclamation', bg: 'bg-secondary bg-opacity-10', text: 'text-secondary', label: 'Admin' },
};
const DEFAULT_META = { icon: 'bi-bell-fill', bg: 'bg-secondary bg-opacity-10', text: 'text-secondary', label: 'Alert' };

const getMeta = (type) => TYPE_META[type] || DEFAULT_META;

// ── Type filter tabs ──────────────────────────────────────────────────────────
const TYPE_FILTERS = [
  { key: 'all',           label: 'All'           },
  { key: 'unread',        label: 'Unread'        },
  { key: 'new_match',     label: 'Matches'       },
  { key: 'new_message',   label: 'Messages'      },
  { key: 'trip_invite',   label: 'Trip Invites'  },
  { key: 'trip_update',   label: 'Trip Updates'  },
];

// ── Time formatter ────────────────────────────────────────────────────────────
const timeAgo = (iso) => {
  const d    = new Date(iso);
  const diff = Date.now() - d;
  const m    = Math.floor(diff / 60000);
  const h    = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (m < 1)    return 'Just now';
  if (m < 60)   return `${m}m ago`;
  if (h < 24)   return `${h}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
};

// ── Component ─────────────────────────────────────────────────────────────────
const Notifications = () => {
  const navigate   = useNavigate();
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markOneRead,
    markAllRead,
    deleteOne,
    deleteAllRead,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await fetchNotifications({ limit: 50 });
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [fetchNotifications]);

  useEffect(() => { load(); }, [load]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.isRead;
    if (activeFilter === 'all')    return true;
    // group trip_invite + trip_join under trip_invite tab
    if (activeFilter === 'trip_invite') return n.type === 'trip_invite' || n.type === 'trip_join';
    // group trip_update + trip_cancelled under trip_update tab
    if (activeFilter === 'trip_update') return n.type === 'trip_update' || n.type === 'trip_cancelled';
    return n.type === activeFilter;
  });

  const tabCount = (key) => {
    if (key === 'all')         return notifications.length;
    if (key === 'unread')      return unreadCount;
    if (key === 'trip_invite') return notifications.filter((n) => n.type === 'trip_invite' || n.type === 'trip_join').length;
    if (key === 'trip_update') return notifications.filter((n) => n.type === 'trip_update' || n.type === 'trip_cancelled').length;
    return notifications.filter((n) => n.type === key).length;
  };

  // ── Navigation on click ────────────────────────────────────────────────────
  const handleClick = async (notif) => {
    if (!notif.isRead) await markOneRead(notif._id);
    const { type, refId, sender } = notif;
    if (type === 'new_message')                                        navigate(`/chat/${sender?._id || refId}`);
    else if (type === 'new_match')                                     navigate('/find-buddy');
    else if (type === 'trip_invite' || type === 'trip_join')           navigate('/trips');
    else if (type === 'trip_update' || type === 'trip_cancelled')      navigate('/trips');
    else if (type === 'new_review')                                    navigate('/reviews');
  };

  const hasReadNotifications = notifications.some((n) => n.isRead);

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="tt-page-header d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <div>
          <h2 className="mb-1">Notifications</h2>
          <p className="text-muted mb-0 small">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'You\'re all caught up!'}
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          {unreadCount > 0 && (
            <button className="btn btn-outline-primary btn-sm" onClick={markAllRead}>
              <i className="bi bi-check2-all me-1" /> Mark all read
            </button>
          )}
          {hasReadNotifications && (
            <button className="btn btn-outline-danger btn-sm" onClick={deleteAllRead}>
              <i className="bi bi-trash me-1" /> Clear read
            </button>
          )}
          <button className="btn btn-outline-secondary btn-sm" onClick={load} title="Refresh">
            <i className="bi bi-arrow-clockwise" />
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible">
          <i className="bi bi-exclamation-triangle-fill me-2" />{error}
          <button className="btn-close" onClick={() => setError('')} />
        </div>
      )}

      {/* Type filter tabs */}
      <div className="mb-3 overflow-auto">
        <ul className="nav nav-pills flex-nowrap gap-1 pb-1">
          {TYPE_FILTERS.map(({ key, label }) => (
            <li className="nav-item" key={key}>
              <button
                className={`nav-link d-flex align-items-center gap-1 ${activeFilter === key ? 'active' : ''}`}
                onClick={() => setActiveFilter(key)}
                style={{ whiteSpace: 'nowrap' }}
              >
                {label}
                {tabCount(key) > 0 && (
                  <span className={`badge rounded-pill ms-1 ${activeFilter === key ? 'bg-white text-primary' : 'bg-primary text-white'}`}
                    style={{ fontSize: '.65rem' }}>
                    {tabCount(key)}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* List */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" />
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-bell-slash fs-1 opacity-25 d-block mb-3" />
              {activeFilter === 'unread'
                ? 'No unread notifications — you\'re all caught up!'
                : `No ${activeFilter === 'all' ? '' : activeFilter.replace('_', ' ')} notifications yet`}
            </div>
          )}

          {!loading && filtered.map((notif, idx) => {
            const meta = getMeta(notif.type);
            return (
              <div
                key={notif._id}
                className={`d-flex align-items-start gap-3 p-3 border-bottom notification-item ${
                  !notif.isRead ? 'bg-primary bg-opacity-5' : ''
                } ${idx === 0 ? '' : ''}`}
                style={{ cursor: 'pointer', transition: 'background .15s' }}
                onClick={() => handleClick(notif)}
              >
                {/* Left: unread indicator + icon */}
                <div className="d-flex align-items-center gap-2 flex-shrink-0">
                  <div style={{ width: 6, height: 6, borderRadius: '50%',
                    background: !notif.isRead ? 'var(--tt-primary)' : 'transparent',
                    flexShrink: 0 }} />
                  <div
                    className={`rounded-circle d-flex align-items-center justify-content-center ${meta.bg} ${meta.text}`}
                    style={{ width: 44, height: 44, fontSize: '1.1rem', flexShrink: 0 }}
                  >
                    <i className={`bi ${meta.icon}`} />
                  </div>
                </div>

                {/* Middle: content */}
                <div className="flex-grow-1 min-w-0">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className="fw-semibold small">{notif.title}</span>
                      <span className={`badge rounded-pill ${meta.bg} ${meta.text}`}
                        style={{ fontSize: '.6rem' }}>
                        {meta.label}
                      </span>
                    </div>
                    <span className="text-muted flex-shrink-0 ms-2" style={{ fontSize: '.7rem', whiteSpace: 'nowrap' }}>
                      {timeAgo(notif.createdAt)}
                    </span>
                  </div>

                  <p className="text-muted mb-1" style={{ fontSize: '.85rem', lineHeight: 1.4 }}>
                    {notif.message}
                  </p>

                  {/* Sender chip */}
                  {notif.sender && (
                    <div className="d-flex align-items-center gap-1 mt-1">
                      {notif.sender.avatar ? (
                        <img src={notif.sender.avatar} alt="" className="rounded-circle"
                          style={{ width: 18, height: 18, objectFit: 'cover' }} />
                      ) : (
                        <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center"
                          style={{ width: 18, height: 18, fontSize: '.55rem' }}>
                          {notif.sender.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="text-muted" style={{ fontSize: '.75rem' }}>{notif.sender.name}</span>
                    </div>
                  )}
                </div>

                {/* Right: action buttons */}
                <div className="d-flex flex-column gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  {!notif.isRead && (
                    <button
                      className="btn btn-sm btn-outline-primary p-1"
                      style={{ lineHeight: 1, fontSize: '.7rem' }}
                      onClick={() => markOneRead(notif._id)}
                      title="Mark as read"
                    >
                      <i className="bi bi-check2" />
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-outline-danger p-1"
                    style={{ lineHeight: 1, fontSize: '.7rem' }}
                    onClick={() => deleteOne(notif._id)}
                    title="Delete"
                  >
                    <i className="bi bi-trash" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: load more hint */}
        {!loading && filtered.length > 0 && (
          <div className="card-footer bg-transparent text-center py-2">
            <small className="text-muted">{filtered.length} notification{filtered.length !== 1 ? 's' : ''}</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
