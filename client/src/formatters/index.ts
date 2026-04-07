import type { UserRole, AuditStatus } from '../types';

export const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return 'Nunca';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
};

export const formatRelativeDate = (dateStr: string): string => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora mesmo';
  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return formatDate(dateStr);
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  moderator: 'Moderador',
  user: 'Usuário',
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-red-500/10 text-red-400 border border-red-500/20',
  moderator: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  user: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
};

export const formatRole = (role: UserRole) => ({
  label: ROLE_LABELS[role],
  className: ROLE_COLORS[role],
});

export const formatActiveStatus = (isActive: number) =>
  isActive
    ? { label: 'Ativo', className: 'bg-emerald-500/10 text-emerald-400' }
    : { label: 'Inativo', className: 'bg-gray-500/10 text-gray-400' };

const AUDIT_ACTION_MAP: Record<string, { label: string; className: string }> = {
  LOGIN: { label: 'Login', className: 'text-emerald-400' },
  LOGIN_FAILED: { label: 'Login Falhado', className: 'text-red-400' },
  LOGIN_BLOCKED: { label: 'Bloqueado', className: 'text-red-500' },
  LOGOUT: { label: 'Logout', className: 'text-gray-400' },
  REGISTER: { label: 'Registro', className: 'text-blue-400' },
  ACCOUNT_LOCKED: { label: 'Conta Bloqueada', className: 'text-orange-400' },
  PASSWORD_CHANGED: { label: 'Senha Alterada', className: 'text-purple-400' },
  ACCESS_DENIED: { label: 'Acesso Negado', className: 'text-red-400' },
  PROFILE_UPDATED: { label: 'Perfil Atualizado', className: 'text-cyan-400' },
  USER_DELETED: { label: 'Excluído', className: 'text-red-500' },
  ROLE_CHANGED: { label: 'Papel Alterado', className: 'text-amber-400' },
  USER_ACTIVATED: { label: 'Ativado', className: 'text-emerald-400' },
  USER_DEACTIVATED: { label: 'Desativado', className: 'text-gray-400' },
  REGISTER_DUPLICATE: { label: 'Registro Duplicado', className: 'text-orange-400' },
  LIST_USERS: { label: 'Listou Usuários', className: 'text-gray-400' },
  INVALID_TOKEN: { label: 'Token Inválido', className: 'text-red-400' },
  PASSWORD_CHANGE_FAILED: { label: 'Troca Senha Falhou', className: 'text-red-400' },
};

export const formatAuditAction = (action: string) =>
  AUDIT_ACTION_MAP[action] ?? { label: action, className: 'text-gray-400' };

const AUDIT_STATUS_MAP: Record<AuditStatus, { label: string; className: string }> = {
  success: { label: 'Sucesso', className: 'bg-emerald-500/10 text-emerald-400' },
  failure: { label: 'Falha', className: 'bg-red-500/10 text-red-400' },
  blocked: { label: 'Bloqueado', className: 'bg-orange-500/10 text-orange-400' },
};

export const formatAuditStatus = (status: AuditStatus) =>
  AUDIT_STATUS_MAP[status];
