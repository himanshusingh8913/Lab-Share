import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/index.js';
import { api, getStoredToken, setStoredToken } from '../services/api.js';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  switchRole: (targetRole: UserRole) => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const initAuth = async () => {
    const token = getStoredToken();
    if (token) {
      try {
        const { user: fetchedUser } = await api.getMe();
        setUser(fetchedUser);
      } catch (err) {
        console.warn('Stored token was invalid or expired, resetting to demo account');
        setStoredToken(null);
        await loginWithSeed('researcher@labshare.edu', 'ResearcherPass123!');
      }
    } else {
      // Default to Researcher seed account for seamless exploration
      await loginWithSeed('researcher@labshare.edu', 'ResearcherPass123!');
    }
    setLoading(false);
  };

  const loginWithSeed = async (email: string, pass: string) => {
    try {
      const res = await api.login(email, pass);
      setStoredToken(res.token);
      setUser(res.user);
    } catch (e: any) {
      console.error('Initial auto-login failed', e);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(email, pass);
      setStoredToken(res.token);
      setUser(res.user);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: any) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.register(data);
      setStoredToken(res.token);
      setUser(res.user);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setStoredToken(null);
    setUser(null);
  };

  const switchRole = async (targetRole: UserRole) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.switchRole(targetRole);
      setStoredToken(res.token);
      setUser(res.user);
    } catch (err: any) {
      setError(err.message || 'Role switch failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const { user: refreshed } = await api.getMe();
      setUser(refreshed);
    } catch (e) {
      console.error('Failed to refresh user profile', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        loading,
        error,
        login,
        register,
        logout,
        switchRole,
        clearError: () => setError(null),
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
