import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import Navbar from '../common/Navbar';

const ADMIN_NAV = [
  { to: '/admin',            icon: 'bi-speedometer2',     label: 'Dashboard'      },
  { to: '/admin/users',      icon: 'bi-people-fill',       label: 'User Management'},
  { to: '/admin/reported',   icon: 'bi-flag-fill',         label: 'Reported Users' },
  { to: '/admin/feedback',   icon: 'bi-chat-square-text-fill', label: 'Feedback'  },
];

/**
 * AdminLayout
 * Identical structure to ProtectedLayout but uses a dedicated
 * admin-only sidebar with a red accent header.
 */
const AdminLayout = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar showMenuBtn onMenuToggle={() => setOpen((o) => !o)} />

      <div className="d-flex flex-grow-1 position-relative">

        {/* Admin sidebar */}
        <>
          {open && (
            <div
              className="d-lg-none position-fixed top-0 start-0 w-100 h-100"
              style={{ background: 'rgba(0,0,0,.5)', zIndex: 1019 }}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
          )}

          <aside className={`tt-sidebar ${open ? 'open' : ''}`}>
            {/* Admin badge header */}
            <div
              className="px-4 py-3 d-flex align-items-center gap-2"
              style={{ background: 'rgba(220,53,69,.15)', borderBottom: '1px solid #2d3139' }}
            >
              <i className="bi bi-shield-lock-fill text-danger fs-5" />
              <span className="text-white fw-bold small">Admin Panel</span>
            </div>

            <nav className="py-2">
              <p className="sidebar-section-title">Management</p>
              {ADMIN_NAV.map(({ to, icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/admin'}
                  className={({ isActive }) =>
                    `sidebar-nav-link${isActive ? ' active' : ''}`
                  }
                  onClick={() => setOpen(false)}
                >
                  <i className={`bi ${icon}`} />
                  <span>{label}</span>
                </NavLink>
              ))}

              <p className="sidebar-section-title mt-3">Navigation</p>
              <NavLink
                to="/dashboard"
                className="sidebar-nav-link"
                onClick={() => setOpen(false)}
              >
                <i className="bi bi-arrow-left-circle" />
                <span>Back to App</span>
              </NavLink>
            </nav>
          </aside>
        </>

        <main className="tt-protected-wrapper flex-grow-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
