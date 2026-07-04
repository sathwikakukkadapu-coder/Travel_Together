import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../common/Navbar';
import Footer from '../common/Footer';

/**
 * PublicLayout
 * Navbar → page content → Footer
 * Used by: Home, About, Contact, Login, Register
 */
const PublicLayout = () => (
  <div className="d-flex flex-column min-vh-100">
    <Navbar />
    <main className="flex-grow-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default PublicLayout;
