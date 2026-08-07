import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/authApi';
import { clearLocalCompareSelectionOnly, syncCompareWithBackend } from '../utils/compareSelection';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);

  // Fetch current user details if token exists
  const loadUser = useCallback(async () => {
    const storedToken = localStorage.getItem('auth_token');
    if (!storedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      if (res.success && res.data) {
        setUser(res.data);
        await syncCompareWithBackend();
      } else {
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
        clearLocalCompareSelectionOnly();
      }
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
      clearLocalCompareSelectionOnly();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.success && res.data?.token) {
      localStorage.setItem('auth_token', res.data.token);
      clearLocalCompareSelectionOnly();
      setToken(res.data.token);
      setUser(res.data.user);
      await syncCompareWithBackend();
      return res.data;
    }
    throw new Error(res.message || 'Login failed.');
  };

  const signup = async (userData) => {
    const res = await authApi.signup(userData);
    clearLocalCompareSelectionOnly();
    return res;
  };

  const verifyEmail = async (email, code) => {
    const res = await authApi.verifyEmail({ email, code });
    if (res.success && res.data?.token) {
      localStorage.setItem('auth_token', res.data.token);
      clearLocalCompareSelectionOnly();
      setToken(res.data.token);
      setUser(res.data.user);
      await syncCompareWithBackend();
    }
    return res;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {}
    localStorage.removeItem('auth_token');
    clearLocalCompareSelectionOnly();
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    role: user?.role || null,
    login,
    signup,
    verifyEmail,
    logout,
    setUser,
    refetchUser: loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
