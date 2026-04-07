import { useUsers, useChangeRole, useChangeStatus, useDeleteUser } from '../hooks/useUsers';
import { formatRole, formatActiveStatus, formatDate } from '../formatters';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import type { UserRole, User } from '../types';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { data, isLoading } = useUsers();
  const changeRole = useChangeRole();
  const changeStatus = useChangeStatus();
  const deleteUser = useDeleteUser();

  const handleRoleChange = async (userId: number, role: UserRole) => {
    try {
      await changeRole.mutateAsync({ id: userId, payload: { role } });
      toast.success('Papel alterado com sucesso.');
    } catch {
      toast.error('Erro ao alterar papel.');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await changeStatus.mutateAsync({
        id: user.id,
        payload: { isActive: !user.is_active },
      });
      toast.success(`Usuário ${user.is_active ? 'desativado' : 'ativado'}.`);
    } catch {
      toast.error('Erro ao alterar status.');
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Deseja excluir permanentemente o usuário "${user.username}"?`)) return;
    try {
      await deleteUser.mutateAsync(user.id);
      toast.success('Usuário excluído.');
    } catch {
      toast.error('Erro ao excluir usuário.');
    }
  };

  const isSelf = (id: number) => currentUser?.id === id;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestão de Usuários</h1>
        <p className="text-gray-500 text-sm mt-1">Painel administrativo com RBAC</p>
      </div>

      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-left text-gray-500">
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Usuário</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Papel</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Último Login</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data?.users.map((user) => {
                const role = formatRole(user.role);
                const status = formatActiveStatus(user.is_active);
                return (
                  <tr key={user.id} className="border-b border-surface-border/50 hover:bg-white/[0.02] transition">
                    <td className="px-4 py-3 text-gray-500">#{user.id}</td>
                    <td className="px-4 py-3 font-medium">
                      {user.username}
                      {isSelf(user.id) && <span className="ml-1 text-xs text-primary">(você)</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{user.email}</td>
                    <td className="px-4 py-3 text-gray-400">{user.fullName || '—'}</td>
                    <td className="px-4 py-3">
                      {isSelf(user.id) ? (
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${role.className}`}>
                          {role.label}
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          className="px-2 py-1 rounded bg-surface-light border border-surface-border text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                        >
                          <option value="user">Usuário</option>
                          <option value="moderator">Moderador</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(user.last_login)}</td>
                    <td className="px-4 py-3">
                      {!isSelf(user.id) && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className="p-1.5 rounded text-gray-500 hover:text-amber-400 hover:bg-amber-400/10 transition"
                            title={user.is_active ? 'Desativar' : 'Ativar'}
                          >
                            {user.is_active ? '🔒' : '🔓'}
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition"
                            title="Excluir"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
