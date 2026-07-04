import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar  from '../common/Navbar';
import Sidebar from '../common/Sidebar';

/**
 * ProtectedLayout
 * Sticky Navbar → fixed Sidebar (left) → scrollable page content
 * Sidebar open/close state lives here so Navbar can trigger it on mobile.
 */
const ProtectedLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar
        showMenuBtn
        onMenuToggle={() => setSidebarOpen((o) => !o)}
      />

      <div className="d-flex flex-grow-1 position-relative">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main content — offset by sidebar width on desktop */}
        <main className="tt-protected-wrapper flex-grow-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ProtectedLayout;
