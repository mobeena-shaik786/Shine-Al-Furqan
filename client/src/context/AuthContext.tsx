import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import axiosInstance, {
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from '../api/axiosInstance';
import type { AuthUser, UserRole } from '../types/auth';
import { getRoleHome } from '../types/auth';

interface LoginResult {
  user: AuthUser;
  accessToken: string;
  redirectTo: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<LoginResult>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeUser(raw: Record<string, unknown>): AuthUser {
  return {
    _id: String(raw._id ?? raw.id ?? ''),
    name: String(raw.name ?? ''),
    email: String(raw.email ?? ''),
    role: raw.role as UserRole,
    phone: raw.phone != null ? String(raw.phone) : '',
    alternatePhone: raw.alternatePhone != null ? String(raw.alternatePhone) : '',
    workLocation: raw.workLocation != null ? String(raw.workLocation) : '',
    isActive: raw.isActive !== false,
    lastLogin: raw.lastLogin ? String(raw.lastLogin) : undefined,
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(getStoredToken());
  const [loading, setLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      // Try refresh cookie session (access token may have expired / cleared)
      try {
        const { data } = await axiosInstance.post('/auth/refresh', {});
        const next = data?.data?.accessToken as string | undefined;
        const rawUser = data?.data?.user as Record<string, unknown> | undefined;
        if (next && rawUser) {
          setStoredToken(next);
          setAccessToken(next);
          setUser(normalizeUser(rawUser));
          setLoading(false);
          return;
        }
      } catch {
        // no refresh cookie
      }
      setUser(null);
      setAccessToken(null);
      setLoading(false);
      return;
    }

    try {
      setAccessToken(token);
      const { data } = await axiosInstance.get('/auth/me');
      const payload = data?.data ?? data?.user ?? data;
      setUser(normalizeUser(payload));
    } catch {
      clearStoredToken();
      setUser(null);
      setAccessToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (email: string, password: string, _remember = true) => {
    const cleanEmail = email.trim();
    const cleanPassword = password.replace(/[\r\n]+/g, '').trim();
    const { data } = await axiosInstance.post('/auth/login', {
      email: cleanEmail,
      password: cleanPassword,
    });
    if (!data?.success || !data.accessToken || !data.user) {
      throw new Error(data?.message || 'Login failed');
    }

    const authUser = normalizeUser(data.user);
    setStoredToken(data.accessToken);
    setAccessToken(data.accessToken);
    setUser(authUser);

    return {
      user: authUser,
      accessToken: data.accessToken as string,
      redirectTo: getRoleHome(authUser.role),
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch {
      // clear local session even if API fails
    } finally {
      clearStoredToken();
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/auth/me');
      const payload = data?.data ?? data?.user ?? data;
      const next = normalizeUser(payload as Record<string, unknown>);
      setUser(next);
      return next;
    } catch {
      return null;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      loading,
      isAuthenticated: Boolean(user && accessToken),
      login,
      logout,
      restoreSession,
      refreshUser,
    }),
    [user, accessToken, loading, login, logout, restoreSession, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
