import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/authApi';

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
      } else {
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
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
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.message || 'Login failed.');
  };

  const signup = async (userData) => {
    const res = await authApi.signup(userData);
    return res;
  };

  const verifyEmail = async (email, code) => {
    const res = await authApi.verifyEmail({ email, code });
    if (res.success && res.data?.token) {
      localStorage.setItem('auth_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    }
    return res;
  };

  const logout = async () => {
    await authApi.logout();
    localStorage.removeItem('auth_token');
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
