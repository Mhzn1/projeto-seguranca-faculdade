import api from './api';
import type {
  ProfileResponse,
  UpdateProfilePayload,
  UsersListResponse,
  AuditLogsResponse,
  MessageResponse,
  RoleChangePayload,
  StatusChangePayload,
} from '../types';

export const UserService = {
  getProfile: () =>
    api.get<ProfileResponse>('/users/profile').then((r) => r.data),

  updateProfile: (payload: UpdateProfilePayload) =>
    api.put<MessageResponse>('/users/profile', payload).then((r) => r.data),

  listUsers: () =>
    api.get<UsersListResponse>('/users').then((r) => r.data),

  changeRole: (id: number, payload: RoleChangePayload) =>
    api.put<MessageResponse>(`/users/${id}/role`, payload).then((r) => r.data),

  changeStatus: (id: number, payload: StatusChangePayload) =>
    api.put<MessageResponse>(`/users/${id}/status`, payload).then((r) => r.data),

  deleteUser: (id: number) =>
    api.delete<MessageResponse>(`/users/${id}`).then((r) => r.data),

  getAuditLogs: (action?: string) =>
    api.get<AuditLogsResponse>('/users/audit-logs', {
      params: action ? { action } : undefined,
    }).then((r) => r.data),
};
