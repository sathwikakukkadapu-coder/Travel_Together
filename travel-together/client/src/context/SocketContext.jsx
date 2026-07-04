import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({}); // { [userId]: true }

  // ── Connect / Disconnect based on auth ──────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Avoid duplicate connections
    if (socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.warn('[socket] connection error:', err.message);
      setIsConnected(false);
    });

    // ── Online presence ────────────────────────────────────────────────────
    socket.on('user:online', ({ userId }) => {
      setOnlineUsers((prev) => ({ ...prev, [userId]: true }));
    });

    socket.on('user:offline', ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, token]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const emit = useCallback((event, ...args) => {
    socketRef.current?.emit(event, ...args);
  }, []);

  /**
   * Register a listener on the live socket.
   * Returns a cleanup function. Safe to call inside useEffect.
   * We read socketRef.current INSIDE the effect body so it always
   * captures the current socket — not a stale one from a previous render.
   */
  const on = useCallback((event, handler) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, [isConnected]); // re-create when connection state changes so callers re-subscribe

  const off = useCallback((event, handler) => {
    socketRef.current?.off(event, handler);
  }, []);

  const joinConversation = useCallback((otherUserId) => {
    socketRef.current?.emit('conversation:join', otherUserId);
  }, []);

  const leaveConversation = useCallback((otherUserId) => {
    socketRef.current?.emit('conversation:leave', otherUserId);
  }, []);

  const joinTripChat = useCallback((tripId) => {
    socketRef.current?.emit('tripChat:join', tripId);
  }, []);

  const leaveTripChat = useCallback((tripId) => {
    socketRef.current?.emit('tripChat:leave', tripId);
  }, []);

  const sendMessage = useCallback((receiverId, content) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) return reject(new Error('Not connected'));
      socketRef.current.emit('message:send', { receiverId, content }, (res) => {
        if (res?.success) resolve(res.data);
        else reject(new Error(res?.error || 'Failed to send'));
      });
    });
  }, []);

  const sendTypingStart = useCallback((receiverId) => {
    socketRef.current?.emit('typing:start', { receiverId });
  }, []);

  const sendTypingStop = useCallback((receiverId) => {
    socketRef.current?.emit('typing:stop', { receiverId });
  }, []);

  const markMessagesRead = useCallback((senderId) => {
    socketRef.current?.emit('messages:read', { senderId });
  }, []);

  const checkOnlineStatus = useCallback((userIds) => {
    return new Promise((resolve) => {
      if (!socketRef.current) return resolve({});
      socketRef.current.emit('users:status', userIds, resolve);
    });
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        onlineUsers,
        emit,
        on,
        off,
        joinConversation,
        leaveConversation,
        joinTripChat,
        leaveTripChat,
        sendMessage,
        sendTypingStart,
        sendTypingStop,
        markMessagesRead,
        checkOnlineStatus,
        setOnlineUsers,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside SocketProvider');
  return ctx;
};

export default SocketContext;
