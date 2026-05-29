/**
 * useAuth Hook — JWT in memory (NOT localStorage)
 * Provides login, logout, and user context.
 * Token is stored only in React state — cleared on page refresh.
 */
import { useState, useCallback, createContext, useContext } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export interface NcmmUser {
  user_id: string;
  username: string;
  role: string;
  clearance_level: number;
  department: string;
  assigned_port?: string | null;
}

interface AuthState {
  token: string | null;
  user: NcmmUser | null;
}

interface AuthContextValue {
  token: string | null;
  user: NcmmUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<NcmmUser>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuthProvider(): AuthContextValue {
  const [auth, setAuth] = useState<AuthState>({ token: null, user: null });

  const login = useCallback(async (username: string, password: string): Promise<NcmmUser> => {
    const response = await axios.post('/api/v1/auth/login', { username, password });
    const { token } = response.data;

    if (!token) throw new Error('No token received from server');

    const decoded = jwtDecode<NcmmUser & { sub: string }>(token);
    setAuth({ token, user: decoded });

    // Set axios default header for all subsequent requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    return decoded;
  }, []);

  const logout = useCallback(() => {
    setAuth({ token: null, user: null });
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  return {
    token: auth.token,
    user: auth.user,
    isAuthenticated: auth.token !== null,
    login,
    logout
  };
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
