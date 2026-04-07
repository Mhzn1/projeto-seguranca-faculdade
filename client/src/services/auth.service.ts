import api from './api';
import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  ChangePasswordPayload,
  MessageResponse,
} from '../types';

export const AuthService = {
  login: (payload: LoginPayload) =>
    api.post<LoginResponse>('/auth/login', payload).then((r) => r.data),

  register: (payload: RegisterPayload) =>
    api.post<MessageResponse>('/auth/register', payload).then((r) => r.data),

  logout: () =>
    api.post<MessageResponse>('/auth/logout').then((r) => r.data),

  changePassword: (payload: ChangePasswordPayload) =>
    api.post<MessageResponse>('/auth/change-password', payload).then((r) => r.data),
};
