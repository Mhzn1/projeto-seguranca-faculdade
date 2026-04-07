/**
 * =============================================
 * SERVIDOR PRINCIPAL
 * =============================================
 * Sistema Seguro de Gestão de Usuários
 * 
 * ASPECTOS DE SEGURANÇA IMPLEMENTADOS:
 * 1. Helmet - Headers HTTP de segurança
 * 2. CORS - Controle de origens permitidas
 * 3. HPP - Prevenção de HTTP Parameter Pollution
 * 4. Rate Limiting - Proteção contra força bruta/DDoS
 * 5. JWT + Sessions - Autenticação robusta
 * 6. Bcrypt (custo 12) - Hash seguro de senhas
 * 7. AES-256 - Criptografia de dados sensíveis (PII)
 * 8. Validação/Sanitização - Prevenção de XSS e injeção
 * 9. RBAC - Controle de acesso por papéis
 * 10. Audit Logging - Rastreabilidade de ações
 * 11. Account Lockout - Bloqueio após tentativas falhadas
 * 12. Secure Sessions - Invalidação e controle de sessões
 */

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const path = require('path');

const { generalLimiter } = require('./middleware/rateLimiter');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARE DE SEGURANÇA
// ==========================================

// Helmet - adiciona headers de segurança HTTP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
    }
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS - permite apenas origens autorizadas
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // Cache preflight por 24h
}));

// HPP - previne poluição de parâmetros HTTP
app.use(hpp());

// Parse de JSON com limite de tamanho (previne payload excessivo)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// Rate limiting global
app.use(generalLimiter);

// Remover header X-Powered-By (ocultar tecnologia)
app.disable('x-powered-by');

// ==========================================
// ARQUIVOS ESTÁTICOS (FRONTEND)
// ==========================================
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// ROTAS DA API
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// ==========================================
// TRATAMENTO DE ERROS GLOBAL
// ==========================================

// Rota não encontrada (404)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Recurso não encontrado',
    message: 'A rota solicitada não existe.'
  });
});

// SPA fallback - todas as outras rotas retornam o index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handler global de erros - NUNCA expor stack traces em produção
app.use((err, req, res, next) => {
  console.error('[SERVER] Erro não tratado:', err.message);

  // Em produção, nunca enviar detalhes do erro
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(err.status || 500).json({
    error: 'Erro interno do servidor',
    message: isProduction
      ? 'Ocorreu um erro inesperado. Tente novamente mais tarde.'
      : err.message,
    // Stack trace APENAS em desenvolvimento
    ...(isProduction ? {} : { stack: err.stack })
  });
});

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================================
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   🔒 SISTEMA SEGURO DE GESTÃO DE USUÁRIOS 🔒    ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║   Servidor rodando em: http://localhost:${PORT}      ║`);
  console.log('║   Ambiente: ' + (process.env.NODE_ENV || 'development').padEnd(37) + '║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║   SEGURANÇA ATIVADA:                             ║');
  console.log('║   ✅ Helmet (Headers HTTP Seguros)                ║');
  console.log('║   ✅ CORS (Controle de Origem)                    ║');
  console.log('║   ✅ Rate Limiting (Anti Força Bruta)             ║');
  console.log('║   ✅ JWT + Sessões (Autenticação)                 ║');
  console.log('║   ✅ Bcrypt custo 12 (Hash de Senhas)             ║');
  console.log('║   ✅ AES-256 (Criptografia de Dados PII)         ║');
  console.log('║   ✅ Validação/Sanitização de Entradas            ║');
  console.log('║   ✅ RBAC (Controle de Acesso por Papéis)         ║');
  console.log('║   ✅ Audit Logging (Rastreabilidade)              ║');
  console.log('║   ✅ Account Lockout (Bloqueio de Conta)          ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
});

module.exports = app;
