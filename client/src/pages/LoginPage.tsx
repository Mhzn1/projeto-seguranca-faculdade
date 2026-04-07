import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import type { ApiError } from '../types';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login({ username, password });
      navigate('/dashboard');
    } catch (err) {
      if (axios.isAxiosError<ApiError>(err)) {
        const msg = err.response?.data?.message ?? 'Erro ao fazer login';
        const remaining = err.response?.data?.remainingAttempts;
        setError(remaining !== undefined ? `${msg} (${remaining} tentativas restantes)` : msg);
      } else {
        setError('Erro de conexão com o servidor.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[rgb(10,10,18)]">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
        {/* Painel visual esquerdo */}
        <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-white/10 blur-3xl" />
          </div>
          <div className="relative z-10 text-center">
            <div className="relative inline-block mb-6">
              <svg className="w-20 h-20 text-white/90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="absolute inset-0 rounded-full animate-pulse-ring border-2 border-white/30" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Secure<span className="text-indigo-200">Auth</span>
            </h1>
            <p className="text-indigo-100/80 text-sm mb-8">Sistema de Gestão Segura de Usuários</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['🔐 AES-256', '🛡️ JWT', '🔑 Bcrypt', '📋 RBAC'].map((badge) => (
                <span key={badge} className="text-xs px-3 py-1.5 rounded-full bg-white/10 text-white/80 border border-white/10">
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Formulário de login */}
        <div className="p-8 sm:p-12 bg-surface flex flex-col justify-center">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="font-bold">Secure<span className="text-primary">Auth</span></span>
          </div>

          <h2 className="text-2xl font-bold mb-1">Entrar</h2>
          <p className="text-gray-500 text-sm mb-8">Autentique-se para acessar o sistema</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-user" className="block text-sm font-medium text-gray-300 mb-1.5">Usuário</label>
              <input
                id="login-user"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Seu nome de usuário"
                required
                autoComplete="username"
                className="w-full px-4 py-2.5 rounded-lg bg-surface-light border border-surface-border text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
              />
            </div>

            <div>
              <label htmlFor="login-pass" className="block text-sm font-medium text-gray-300 mb-1.5">Senha</label>
              <div className="relative">
                <input
                  id="login-pass"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 pr-11 rounded-lg bg-surface-light border border-surface-border text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {error && (
              <div className="animate-fade-in p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Não tem conta?{' '}
            <Link to="/register" className="text-primary-light hover:underline font-medium">Criar conta</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
