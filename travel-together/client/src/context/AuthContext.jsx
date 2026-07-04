import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import api from '../services/api';

// ─── State shape ─────────────────────────────────────────
const initialState = {
  user:        null,   // { _id, name, email, avatar, role }
  profile:     null,
  token:       localStorage.getItem('tt_token') || null,
  isLoading:   true,   // true while we verify the stored token on mount
  isAuthenticated: false,
};

// ─── Reducer ─────────────────────────────────────────────
const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, isLoading: true };

    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      localStorage.setItem('tt_token', action.payload.token);
      return {
        ...state,
        user:            action.payload.user,
        token:           action.payload.token,
        isAuthenticated: true,
        isLoading:       false,
      };

    case 'LOAD_USER_SUCCESS':
      return {
        ...state,
        user:            action.payload.user,
        profile:         action.payload.profile,
        isAuthenticated: true,
        isLoading:       false,
      };

    case 'UPDATE_PROFILE':
      return { ...state, profile: action.payload };

    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };

    case 'UPDATE_AVATAR':
      return {
        ...state,
        user: { ...state.user, avatar: action.payload },
      };

    case 'LOGOUT':
    case 'AUTH_ERROR':
      localStorage.removeItem('tt_token');
      return { ...initialState, token: null, isLoading: false };

    default:
      return state;
  }
};

// ─── Context ─────────────────────────────────────────────
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On mount: if a token exists in localStorage, validate it
  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('tt_token');
    if (!token) {
      dispatch({ type: 'AUTH_ERROR' });
      return;
    }

    try {
      dispatch({ type: 'AUTH_LOADING' });
      const res = await api.get('/auth/me');
      dispatch({
        type: 'LOAD_USER_SUCCESS',
        payload: { user: res.data.user, profile: res.data.profile },
      });
    } catch {
      dispatch({ type: 'AUTH_ERROR' });
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  // ── Actions ───────────────────────────────────────────

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    dispatch({ type: 'REGISTER_SUCCESS', payload: res.data });
    return res.data;
  };

  const login = async (formData) => {
    const res = await api.post('/auth/login', formData);
    dispatch({ type: 'LOGIN_SUCCESS', payload: res.data });
    return res.data;
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    dispatch({ type: 'LOGOUT' });
  };

  const updateProfile = (profile) =>
    dispatch({ type: 'UPDATE_PROFILE', payload: profile });

  const updateUser = (userFields) =>
    dispatch({ type: 'UPDATE_USER', payload: userFields });

  const updateAvatar = (avatarUrl) =>
    dispatch({ type: 'UPDATE_AVATAR', payload: avatarUrl });

  return (
    <AuthContext.Provider
      value={{
        ...state,
        register,
        login,
        logout,
        loadUser,
        updateProfile,
        updateUser,
        updateAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default AuthContext;
