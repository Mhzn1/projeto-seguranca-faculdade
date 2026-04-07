import type { AuthUser } from '../types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// sessionStorage para tokens: limpo ao fechar aba (mais seguro que localStorage)
export const getToken = (): string | null =>
  sessionStorage.getItem(TOKEN_KEY);

export const setToken = (token: string): void =>
  sessionStorage.setItem(TOKEN_KEY, token);

export const removeToken = (): void => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
};

export const getStoredUser = (): AuthUser | null => {
  const data = sessionStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as AuthUser;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: AuthUser): void =>
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
