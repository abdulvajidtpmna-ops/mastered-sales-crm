import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '../types';
import {
  api,
  getStoredSession,
  saveStoredSession,
  clearStoredSession,
  onSessionExpired,
} from '../services/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  permissions: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;
  isChairman: boolean;
  isSalesperson: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<any>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { error, warning, success } = useToast();

  const handleSessionExpired = useCallback(() => {
    setUser(null);
    setToken(null);
    setPermissions({});
    warning('Your session has expired. Please log in again.');
  }, [warning]);

  useEffect(() => {
    const unsubscribe = onSessionExpired(handleSessionExpired);
    return () => unsubscribe();
  }, [handleSessionExpired]);

  // STEP 4 & 5: Initial session restoration from localStorage (msa_session)
  const initializeSession = useCallback(async () => {
    setIsLoading(true);
    const session = getStoredSession();

    if (!session || !session.token || !session.user) {
      setUser(null);
      setToken(null);
      setPermissions({});
      setIsLoading(false);
      return;
    }

    // Restore state from valid storage immediately
    setUser(session.user);
    setToken(session.token);
    setPermissions(session.permissions || {});

    // Validate with backend in background
    try {
      const res = await api.getUser();
      const updatedUser = res.data?.user || (res as any).user;
      if (res.success && updatedUser) {
        setUser(updatedUser);
        saveStoredSession(session.token, updatedUser, res.data?.permissions || session.permissions);
      } else if (
        res.message &&
        (res.message.toLowerCase().includes('expired') ||
          res.message.toLowerCase().includes('invalid') ||
          res.message.toLowerCase().includes('unauthorized'))
      ) {
        clearStoredSession();
        setUser(null);
        setToken(null);
        setPermissions({});
      }
    } catch (err) {
      console.warn('[AUTH] Offline/Network issue during getuser check, keeping restored session');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  // STEP 5: Sequence after successful login
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const cleanEmail = email.trim();

    try {
      const res = await api.login(cleanEmail, password);

      const resToken = res.data?.token || (res as any).token || (res as any).result?.token;
      const resUser = res.data?.user || (res as any).user || (res as any).result?.user;
      const resPermissions = res.data?.permissions || (res as any).permissions || (res as any).result?.permissions || {};

      if (res.success && resToken && resUser) {
        // 1. Save session to localStorage
        saveStoredSession(resToken, resUser, resPermissions);

        // 2. Update AuthContext state
        setUser(resUser);
        setToken(resToken);
        setPermissions(resPermissions);

        success(`Welcome back, ${resUser.name || 'Staff'}!`);
        return { success: true };
      } else {
        const msg = res.message || 'Invalid email or password.';
        error(msg);
        return { success: false, message: msg };
      }
    } catch (err: any) {
      const msg = err.message || 'Unable to connect to CRM server. Please check your internet connection.';
      error(msg);
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
    } catch {
      // Ignore errors on logout
    } finally {
      clearStoredSession();
      setUser(null);
      setToken(null);
      setPermissions({});
      setIsLoading(false);
      success('Logged out successfully.');
    }
  };

  const refreshUser = async () => {
    await initializeSession();
  };

  const role = user?.role || null;
  const isChairman = role === 'CHAIRMAN';
  const isSalesperson = role === 'SALESPERSON';
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        permissions,
        isAuthenticated,
        isLoading,
        role,
        isChairman,
        isSalesperson,
        login,
        logout,
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
