import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, AuthTokens } from '../types';
import { authApi, usersApi } from '../services';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({ user: null, isLoading: true, isAuthenticated: false });

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setState({ user: null, isLoading: false, isAuthenticated: false }); return; }
    try {
      const { data } = await usersApi.getProfile();
      setState({ user: data.data, isLoading: false, isAuthenticated: true });
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setState({ user: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    const tokens = data.data as AuthTokens;
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    setState({ user: tokens.user, isLoading: false, isAuthenticated: true });
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) { try { await authApi.logout(refreshToken); } catch {} }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setState({ user: null, isLoading: false, isAuthenticated: false });
  };

  const updateUser = (user: User) => setState((s) => ({ ...s, user }));

  return <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
