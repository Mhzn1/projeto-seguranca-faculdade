import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { AuthService } from '../services/auth.service';
import { getToken, setToken, removeToken, getStoredUser, setStoredUser } from '../utils/storage';
import type { AuthUser, LoginPayload, RegisterPayload } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<string>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (!getToken()) return null;
    return getStoredUser();
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const data = await AuthService.login(payload);
      setToken(data.token);
      setStoredUser(data.user);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<string> => {
    setIsLoading(true);
    try {
      const result = await AuthService.register(payload);
      return result.message;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AuthService.logout();
    } finally {
      removeToken();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && !!getToken(),
        login,
        register,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}
