import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    try {
      const { user, subscription } = await API.auth.me();
      setUser(user);
      setSubscription(subscription || null);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = useCallback(async (credentials) => {
    const { token, user, subscription } = await API.auth.login(credentials);
    localStorage.setItem('token', token);
    setUser(user);
    setSubscription(subscription || null);
    return user;
  }, []);

  const register = useCallback(async (data) => {
    const { token, user } = await API.auth.register(data);
    localStorage.setItem('token', token);
    setUser(user);
    setSubscription(null);
    return user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setSubscription(null);
  }, []);

  const hasSubscription = useCallback(() => {
    if (!subscription) return false;
    return subscription.status === 'active' && new Date(subscription.end_date) > new Date();
  }, [subscription]);

  const isAdmin = useCallback(() => user?.role === 'admin', [user]);

  const value = {
    user, subscription, loading,
    login, register, logout, loadUser,
    setSubscription,
    hasSubscription, isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
