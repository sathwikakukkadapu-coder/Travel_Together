import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from './Loader';

/**
 * AdminRoute
 * Extends ProtectedRoute — also checks role === 'admin'.
 * Non-admin authenticated users are redirected to /dashboard.
 */
const AdminRoute = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <Loader fullPage />;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return <Outlet />;
};

export default AdminRoute;
