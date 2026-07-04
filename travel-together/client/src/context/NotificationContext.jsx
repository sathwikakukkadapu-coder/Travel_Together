import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { on, off } = useSocket();
  const [unreadCount, setUnreadCount]     = useState(0);
  const [notifications, setNotifications] = useState([]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.count || 0);
    } catch { /* silent */ }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async (params = {}) => {
    if (!isAuthenticated) return;
    try {
      const res = await api.get('/notifications', { params: { limit: 20, ...params } });
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unreadCount ?? res.data.count ?? 0);
    } catch { /* silent */ }
  }, [isAuthenticated]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const markOneRead = useCallback(async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* silent */ }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* silent */ }
  }, []);

  const deleteOne = useCallback(async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => {
        const removed = prev.find((n) => n._id === id);
        if (removed && !removed.isRead) setUnreadCount((c) => Math.max(0, c - 1));
        return prev.filter((n) => n._id !== id);
      });
    } catch { /* silent */ }
  }, []);

  const deleteAllRead = useCallback(async () => {
    try {
      await api.delete('/notifications/read');
      setNotifications((prev) => prev.filter((n) => !n.isRead));
    } catch { /* silent */ }
  }, []);

  // ── Real-time via Socket.IO ────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    const handler = (notification) => {
      setNotifications((prev) => {
        if (prev.some((n) => n._id === notification._id)) return prev;
        return [notification, ...prev];
      });
      setUnreadCount((c) => c + 1);
    };
    const cleanup = on('notification:new', handler);
    return () => { typeof cleanup === 'function' ? cleanup() : off('notification:new', handler); };
  }, [isAuthenticated, on, off]);

  // ── Initial load + 5-min fallback poll ────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 300_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUnreadCount]);

  return (
    <NotificationContext.Provider value={{
      unreadCount,
      notifications,
      fetchNotifications,
      fetchUnreadCount,
      markOneRead,
      markAllRead,
      deleteOne,
      deleteAllRead,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
};

export default NotificationContext;
