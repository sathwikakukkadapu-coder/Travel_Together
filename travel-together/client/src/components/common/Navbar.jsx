import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { getInitials } from '../../utils/helpers';

/**
 * Navbar — shared between Public and Protected layouts.
 * @param {function} onMenuToggle — called when the hamburger is clicked (protected layout only)
 * @param {boolean}  showMenuBtn  — whether to show the sidebar toggle button
 */
const Navbar = ({ onMenuToggle, showMenuBtn = false }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="tt-navbar navbar navbar-expand-lg px-3">
      <div className="container-fluid">

        {/* Sidebar toggle (protected pages, mobile) */}
        {showMenuBtn && (
          <button
            className="btn btn-link text-dark p-1 me-2 d-lg-none"
            onClick={onMenuToggle}
            aria-label="Toggle sidebar"
          >
            <i className="bi bi-list fs-4" />
          </button>
        )}

        {/* Brand */}
        <Link to="/" className="navbar-brand d-flex align-items-center gap-2">
          <i className="bi bi-airplane-engines-fill text-primary" />
          Travel Together
        </Link>

        {/* Public nav links (collapsed on mobile) */}
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#publicNav"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="publicNav">
          {/* Public links — visible when not authenticated */}
          {!isAuthenticated && (
            <ul className="navbar-nav ms-auto align-items-center gap-1">
              <li className="nav-item">
                <NavLink to="/"        className="nav-link">Home</NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/about"   className="nav-link">About</NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/contact" className="nav-link">Contact</NavLink>
              </li>
              <li className="nav-item ms-2">
                <NavLink to="/login"   className="btn btn-outline-primary btn-sm px-3">
                  Login
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/register" className="btn btn-primary btn-sm px-3">
                  Register
                </NavLink>
              </li>
            </ul>
          )}

          {/* Authenticated top-right actions */}
          {isAuthenticated && (
            <ul className="navbar-nav ms-auto align-items-center gap-2">

              {/* Notifications bell */}
              <li className="nav-item">
                <NavLink
                  to="/notifications"
                  className="nav-link position-relative"
                  aria-label="Notifications"
                >
                  <i className="bi bi-bell fs-5" />
                  {unreadCount > 0 && (
                    <span
                      className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                      style={{ fontSize: '.6rem' }}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </NavLink>
              </li>

              {/* User dropdown */}
              <li className="nav-item dropdown">
                <button
                  className="btn btn-link nav-link d-flex align-items-center gap-2 p-0"
                  onClick={() => setDropdownOpen((o) => !o)}
                  aria-expanded={dropdownOpen}
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="rounded-circle"
                      width={32}
                      height={32}
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                      style={{ width: 32, height: 32, fontSize: '.75rem' }}
                    >
                      {getInitials(user?.name)}
                    </div>
                  )}
                  <span className="d-none d-md-inline small fw-semibold">
                    {user?.name?.split(' ')[0]}
                  </span>
                  <i className="bi bi-chevron-down small" />
                </button>

                {dropdownOpen && (
                  <ul
                    className="dropdown-menu dropdown-menu-end shadow show"
                    style={{ minWidth: 180 }}
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    <li>
                      <Link
                        className="dropdown-item"
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <i className="bi bi-person me-2" />My Profile
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="dropdown-item"
                        to="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <i className="bi bi-grid me-2" />Dashboard
                      </Link>
                    </li>
                    {user?.role === 'admin' && (
                      <li>
                        <Link
                          className="dropdown-item text-warning"
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <i className="bi bi-shield-lock me-2" />Admin Panel
                        </Link>
                      </li>
                    )}
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button
                        className="dropdown-item text-danger"
                        onClick={handleLogout}
                      >
                        <i className="bi bi-box-arrow-right me-2" />Logout
                      </button>
                    </li>
                  </ul>
                )}
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
