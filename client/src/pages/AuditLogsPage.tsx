import { useState } from 'react';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { formatDate, formatAuditAction, formatAuditStatus } from '../formatters';

const FILTER_OPTIONS = [
  { value: '', label: 'Todas as ações' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGIN_FAILED', label: 'Login Falhado' },
  { value: 'REGISTER', label: 'Registro' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'ACCOUNT_LOCKED', label: 'Conta Bloqueada' },
  { value: 'PASSWORD_CHANGED', label: 'Senha Alterada' },
  { value: 'ACCESS_DENIED', label: 'Acesso Negado' },
  { value: 'USER_DELETED', label: 'Exclusão' },
] as const;

export default function AuditLogsPage() {
  const [filter, setFilter] = useState('');
  const { data, isLoading } = useAuditLogs(filter || undefined);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Logs de Auditoria</h1>
          <p className="text-gray-500 text-sm mt-1">Rastreabilidade completa de todas as ações</p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-surface-light border border-surface-border text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
        >
          {FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Data/Hora</th>
                <th className="px-4 py-3 font-medium">Usuário</th>
                <th className="px-4 py-3 font-medium">Ação</th>
                <th className="px-4 py-3 font-medium">Detalhes</th>
                <th className="px-4 py-3 font-medium">IP</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.logs.map((log) => {
                const action = formatAuditAction(log.action);
                const status = formatAuditStatus(log.status);
                return (
                  <tr key={log.id} className="border-b border-surface-border/50 hover:bg-white/[0.02] transition">
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3 font-medium">{log.username ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${action.className}`}>{action.label}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">
                      {log.details ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">{log.ip_address ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {data?.logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    Nenhum log encontrado para o filtro selecionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
