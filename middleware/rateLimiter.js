/**
 * =============================================
 * MIDDLEWARE DE RATE LIMITING
 * =============================================
 * - Prevenção contra ataques de força bruta
 * - Limites diferenciados por tipo de rota
 * - Proteção contra DDoS básico
 */

const rateLimit = require('express-rate-limit');

/**
 * Rate limiter geral - aplica-se a todas as rotas
 */
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Muitas requisições',
    message: 'Você excedeu o limite de requisições. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter rigoroso para rotas de autenticação
 * Previne ataques de força bruta em login/registro
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 tentativas de login por IP em 15 min
  message: {
    error: 'Muitas tentativas de login',
    message: 'Excesso de tentativas de autenticação. Aguarde 15 minutos antes de tentar novamente.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Não conta requisições bem-sucedidas
});

/**
 * Rate limiter para operações sensíveis (alteração de senha, etc.)
 */
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // Máximo 5 tentativas por hora
  message: {
    error: 'Limite de operações sensíveis',
    message: 'Excesso de tentativas para esta operação. Aguarde 1 hora.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { generalLimiter, authLimiter, sensitiveLimiter };
