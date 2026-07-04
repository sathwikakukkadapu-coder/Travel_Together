import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { getInitials } from '../../utils/helpers';

const NAV_ITEMS = [
  { to: '/dashboard',     icon: 'bi-grid-fill',         label: 'Dashboard' },
  { to: '/profile',       icon: 'bi-person-circle',     label: 'My Profile' },
  { to: '/find-buddy',    icon: 'bi-people-fill',        label: 'Find Travel Buddy' },
  { to: '/trips',         icon: 'bi-map-fill',           label: 'Trip Planner' },
  { to: '/chat',          icon: 'bi-chat-dots-fill',     label: 'Chat' },
  { to: '/notifications', icon: 'bi-bell-fill',          label: 'Notifications' },
  { to: '/reviews',       icon: 'bi-star-fill',          label: 'Reviews & Ratings' },
];

const ADMIN_ITEMS = [
  { to: '/admin',          icon: 'bi-speedometer2',      label: 'Admin Dashboard' },
  { to: '/admin/users',    icon: 'bi-people',             label: 'User Management' },
  { to: '/admin/reported', icon: 'bi-flag-fill',          label: 'Reported Users' },
  { to: '/admin/feedback', icon: 'bi-chat-square-text',   label: 'Feedback' },
];

/**
 * Sidebar
 * @param {boolean}  isOpen        — controls mobile visibility
 * @param {function} onClose       — called when overlay is tapped on mobile
 */
const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="d-lg-none position-fixed top-0 start-0 w-100 h-100"
          style={{ background: 'rgba(0,0,0,.5)', zIndex: 1019 }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`tt-sidebar ${isOpen ? 'open' : ''}`}>

        {/* User mini-profile */}
        <div className="p-3 border-bottom border-secondary d-flex align-items-center gap-3"
             style={{ borderColor: '#2d3139 !important' }}>
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="rounded-circle"
              width={40}
              height={40}
              style={{ objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div
              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
              style={{ width: 40, height: 40, fontSize: '.8rem' }}
            >
              {getInitials(user?.name)}
            </div>
          )}
          <div className="overflow-hidden">
            <p className="text-white fw-semibold mb-0 text-truncate small">
              {user?.name}
            </p>
            <p className="mb-0 text-truncate" style={{ fontSize: '.7rem', color: '#6c757d' }}>
              {user?.email}
            </p>
          </div>
        </div>

        {/* Main navigation */}
        <nav className="py-2">
          <p className="sidebar-section-title">Main Menu</p>

          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar-nav-link${isActive ? ' active' : ''}`
              }
              onClick={onClose}
            >
              <i className={`bi ${icon}`} />
              <span>{label}</span>
              {/* Notification badge on Chat and Notifications items */}
              {to === '/notifications' && unreadCount > 0 && (
                <span className="badge rounded-pill bg-danger ms-auto" style={{ fontSize: '.65rem' }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>
          ))}

          {/* Admin section — only visible to admin role */}
          {user?.role === 'admin' && (
            <>
              <p className="sidebar-section-title mt-2">Admin</p>
              {ADMIN_ITEMS.map(({ to, icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `sidebar-nav-link${isActive ? ' active' : ''}`
                  }
                  onClick={onClose}
                >
                  <i className={`bi ${icon}`} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Logout at the bottom */}
        <div className="mt-auto p-3" style={{ marginTop: 'auto' }}>
          <hr style={{ borderColor: '#2d3139' }} />
          <button
            className="sidebar-nav-link w-100 text-start border-0 bg-transparent text-danger"
            onClick={handleLogout}
          >
            <i className="bi bi-box-arrow-left" />
            <span>Logout</span>
          </button>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;
