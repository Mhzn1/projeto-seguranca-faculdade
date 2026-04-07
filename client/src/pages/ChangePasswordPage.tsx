import { useState, type FormEvent } from 'react';
import { useChangePassword } from '../hooks/useUsers';
import { isStrongPassword } from '../utils/validators';
import PasswordStrength from '../components/PasswordStrength';
import toast from 'react-hot-toast';
import { isAxiosError } from 'axios';
import type { ApiError } from '../types';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const changePassword = useChangePassword();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }
    if (!isStrongPassword(newPassword)) {
      toast.error('A senha não atende os critérios de segurança.');
      return;
    }

    try {
      const result = await changePassword.mutateAsync({ currentPassword, newPassword });
      toast.success(result.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      if (isAxiosError<ApiError>(err)) {
        toast.error(err.response?.data?.message ?? 'Erro ao alterar senha.');
      }
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 rounded-lg bg-surface-light border border-surface-border text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Alterar Senha</h1>
        <p className="text-gray-500 text-sm mt-1">Operação sensível com rate limiting</p>
      </div>

      <div className="glass rounded-xl p-6 max-w-lg">
        {/* Aviso de segurança */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm mb-6">
          <span className="text-lg">⚠️</span>
          <p>Ao alterar sua senha, todas as outras sessões ativas serão encerradas por segurança.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="cur-pass" className="block text-sm font-medium text-gray-300 mb-1">Senha Atual</label>
            <input id="cur-pass" type="password" value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Sua senha atual" required autoComplete="current-password"
              className={inputClass} />
          </div>

          <div>
            <label htmlFor="new-pass" className="block text-sm font-medium text-gray-300 mb-1">Nova Senha</label>
            <input id="new-pass" type="password" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mín. 8 chars, maiúsc., minúsc., número, especial" required minLength={8}
              autoComplete="new-password" className={inputClass} />
            <PasswordStrength password={newPassword} />
          </div>

          <div>
            <label htmlFor="confirm-pass" className="block text-sm font-medium text-gray-300 mb-1">Confirmar Nova Senha</label>
            <input id="confirm-pass" type="password" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha" required autoComplete="new-password"
              className={inputClass} />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-400 mt-1">As senhas não coincidem</p>
            )}
          </div>

          <button type="submit" disabled={changePassword.isPending}
            className="w-full py-2.5 rounded-lg bg-primary text-white font-semibold hover:brightness-110 transition disabled:opacity-50">
            {changePassword.isPending ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
