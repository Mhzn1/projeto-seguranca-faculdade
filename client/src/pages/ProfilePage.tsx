import { useState, type FormEvent } from 'react';
import { useProfile, useUpdateProfile } from '../hooks/useUsers';
import { formatDate } from '../formatters';
import { formatPhone } from '../utils/validators';
import { formatRole } from '../formatters';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { data, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const [edited, setEdited] = useState(false);
  const [form, setForm] = useState({ email: '', fullName: '', phone: '' });

  const profile = data?.profile;

  const initForm = () => {
    if (profile && !edited) {
      setForm({
        email: profile.email,
        fullName: profile.fullName,
        phone: profile.phone,
      });
      setEdited(true);
    }
  };

  if (profile && !edited) initForm();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync(form);
      toast.success('Perfil atualizado com sucesso!');
    } catch {
      toast.error('Erro ao atualizar perfil.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const roleInfo = profile ? formatRole(profile.role) : null;
  const inputClass =
    'w-full px-4 py-2.5 rounded-lg bg-surface-light border border-surface-border text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie suas informações pessoais</p>
      </div>

      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Informações Pessoais</h3>
          <span className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            Dados Criptografados 🔐
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Usuário</label>
              <input type="text" value={profile?.username ?? ''} disabled
                className={`${inputClass} opacity-50 cursor-not-allowed`} />
            </div>
            <div>
              <label htmlFor="prof-email" className="block text-sm font-medium text-gray-400 mb-1">E-mail</label>
              <input id="prof-email" type="email" value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className={inputClass} />
            </div>
            <div>
              <label htmlFor="prof-name" className="block text-sm font-medium text-gray-400 mb-1">Nome Completo</label>
              <input id="prof-name" type="text" value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                className={inputClass} />
            </div>
            <div>
              <label htmlFor="prof-phone" className="block text-sm font-medium text-gray-400 mb-1">Telefone 🔐</label>
              <input id="prof-phone" type="text" value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: formatPhone(e.target.value) }))}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Papel</label>
              {roleInfo && (
                <div className={`inline-flex px-3 py-2 rounded-lg text-sm font-medium ${roleInfo.className}`}>
                  {roleInfo.label}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Membro desde</label>
              <input type="text" value={formatDate(profile?.createdAt ?? null)} disabled
                className={`${inputClass} opacity-50 cursor-not-allowed`} />
            </div>
          </div>

          <button type="submit" disabled={updateProfile.isPending}
            className="px-6 py-2.5 rounded-lg bg-primary text-white font-semibold hover:brightness-110 transition disabled:opacity-50">
            {updateProfile.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>

      {/* Painel de segurança */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Segurança da Informação</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: '🔑', title: 'Senha', desc: 'Hash Bcrypt (custo 12)', color: 'emerald' },
            { icon: '🔐', title: 'Dados Pessoais', desc: 'Criptografia AES-256', color: 'blue' },
            { icon: '🛡️', title: 'Sessão', desc: 'Token JWT (1h)', color: 'purple' },
            { icon: '📋', title: 'Auditoria', desc: 'Ações registradas', color: 'amber' },
          ].map((item) => (
            <div key={item.title} className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <div className="text-2xl mb-2">{item.icon}</div>
              <p className="font-semibold text-sm">{item.title}</p>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
