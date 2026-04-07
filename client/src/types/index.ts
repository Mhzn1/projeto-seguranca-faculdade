export type UserRole = 'admin' | 'user' | 'moderator';
export type AuditStatus = 'success' | 'failure' | 'blocked';

export interface AuthUser {
  id: number;
  username: string;
  role: UserRole;
  lastLogin: string | null;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  fullName: string;
  cpf: string;
  phone: string;
  role: UserRole;
  lastLogin: string | null;
  createdAt: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  is_active: number;
  failed_login_attempts: number;
  last_login: string | null;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number | null;
  username: string | null;
  action: string;
  resource: string | null;
  details: string | null;
  ip_address: string | null;
  status: AuditStatus;
  created_at: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  cpf?: string;
  phone?: string;
}

export interface UpdateProfilePayload {
  email?: string;
  fullName?: string;
  phone?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface RoleChangePayload {
  role: UserRole;
}

export interface StatusChangePayload {
  isActive: boolean;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export interface MessageResponse {
  message: string;
}

export interface ProfileResponse {
  profile: UserProfile;
}

export interface UsersListResponse {
  users: User[];
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
}

export interface ApiError {
  error: string;
  message: string;
  messages?: string[];
  remainingAttempts?: number;
}
