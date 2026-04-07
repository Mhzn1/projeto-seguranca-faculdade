import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { formatCPF, formatPhone } from '../utils/validators';
import PasswordStrength from '../components/PasswordStrength';
import type { ApiError } from '../types';

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    cpf: '',
    phone: '',
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState('');
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const updateField = (field: keyof typeof form, value: string) => {
    if (field === 'cpf') value = formatCPF(value);
    if (field === 'phone') value = formatPhone(value);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setSuccess('');

    try {
      const message = await register({
        username: form.username,
        email: form.email,
        password: form.password,
        fullName: form.fullName || undefined,
        cpf: form.cpf || undefined,
        phone: form.phone || undefined,
      });
      setSuccess(message);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      if (axios.isAxiosError<ApiError>(err)) {
        const data = err.response?.data;
        setErrors(data?.messages ?? [data?.message ?? 'Erro ao registrar.']);
      } else {
        setErrors(['Erro de conexão com o servidor.']);
      }
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 rounded-lg bg-surface-light border border-surface-border text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[rgb(10,10,18)]">
      <div className="w-full max-w-lg p-8 sm:p-10 rounded-2xl bg-surface border border-surface-border shadow-2xl shadow-black/50 animate-fade-in">
        <div className="flex items-center gap-2 mb-6">
          <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="font-bold">Secure<span className="text-primary">Auth</span></span>
        </div>

        <h2 className="text-2xl font-bold mb-1">Criar Conta</h2>
        <p className="text-gray-500 text-sm mb-6">Registre-se com segurança</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-user" className="block text-sm font-medium text-gray-300 mb-1">Usuário *</label>
              <input id="reg-user" type="text" value={form.username} onChange={(e) => updateField('username', e.target.value)}
                placeholder="Nome de usuário" required minLength={3} maxLength={30} className={inputClass} />
            </div>
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-gray-300 mb-1">E-mail *</label>
              <input id="reg-email" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)}
                placeholder="seu@email.com" required className={inputClass} />
            </div>
          </div>

          <div>
            <label htmlFor="reg-name" className="block text-sm font-medium text-gray-300 mb-1">Nome Completo</label>
            <input id="reg-name" type="text" value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)}
              placeholder="Seu nome completo" maxLength={100} className={inputClass} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-cpf" className="block text-sm font-medium text-gray-300 mb-1">
                CPF <span className="text-primary text-xs">🔐 criptografado</span>
              </label>
              <input id="reg-cpf" type="text" value={form.cpf} onChange={(e) => updateField('cpf', e.target.value)}
                placeholder="000.000.000-00" maxLength={14} className={inputClass} />
            </div>
            <div>
              <label htmlFor="reg-phone" className="block text-sm font-medium text-gray-300 mb-1">
                Telefone <span className="text-primary text-xs">🔐 criptografado</span>
              </label>
              <input id="reg-phone" type="text" value={form.phone} onChange={(e) => updateField('phone', e.target.value)}
                placeholder="(00) 00000-0000" className={inputClass} />
            </div>
          </div>

          <div>
            <label htmlFor="reg-pass" className="block text-sm font-medium text-gray-300 mb-1">Senha *</label>
            <input id="reg-pass" type="password" value={form.password} onChange={(e) => updateField('password', e.target.value)}
              placeholder="Mín. 8 chars, maiúsc., minúsc., número, especial" required minLength={8} className={inputClass} />
            <PasswordStrength password={form.password} />
          </div>

          {errors.length > 0 && (
            <div className="animate-fade-in p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm space-y-1">
              {errors.map((err, i) => (<p key={i}>• {err}</p>))}
            </div>
          )}

          {success && (
            <div className="animate-fade-in p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              ✅ {success} — Redirecionando...
            </div>
          )}

          <button type="submit" disabled={isLoading}
            className="w-full py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? 'Registrando...' : 'Criar Conta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Já tem conta?{' '}
          <Link to="/login" className="text-primary-light hover:underline font-medium">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
