/**
 * =============================================
 * MIDDLEWARE DE AUTENTICAÇÃO E AUTORIZAÇÃO
 * =============================================
 * - Verificação de tokens JWT
 * - Controle de acesso baseado em papéis (RBAC)
 * - Validação de sessões ativas
 */

const jwt = require('jsonwebtoken');
const { getDatabase } = require('../database/init');
const { hashToken } = require('../utils/crypto');
const { logAudit } = require('../utils/logger');

/**
 * Middleware de autenticação - verifica se o token JWT é válido
 */
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Acesso não autorizado',
        message: 'Token de autenticação não fornecido'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verificar se o token é válido
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar se a sessão ainda está ativa no banco
    const db = getDatabase();
    const tokenHash = hashToken(token);
    const session = db.prepare(
      `SELECT * FROM sessions WHERE token_hash = ? AND expires_at > datetime('now')`
    ).get(tokenHash);

    if (!session) {
      return res.status(401).json({
        error: 'Sessão expirada',
        message: 'Sua sessão foi encerrada. Faça login novamente.'
      });
    }

    // Verificar se o usuário ainda está ativo
    const user = db.prepare('SELECT id, username, role, is_active FROM users WHERE id = ?').get(decoded.userId);

    if (!user || !user.is_active) {
      return res.status(403).json({
        error: 'Conta desativada',
        message: 'Sua conta foi desativada. Contate o administrador.'
      });
    }

    // Anexar dados do usuário à requisição
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };
    req.token = token;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        message: 'Seu token de acesso expirou. Faça login novamente.'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      logAudit({
        action: 'INVALID_TOKEN',
        details: 'Tentativa de acesso com token inválido',
        ipAddress: req.ip,
        status: 'blocked'
      });
      return res.status(401).json({
        error: 'Token inválido',
        message: 'Token de autenticação malformado ou adulterado.'
      });
    }
    return res.status(500).json({
      error: 'Erro interno',
      message: 'Erro ao processar autenticação.'
    });
  }
}

/**
 * Middleware de autorização - controle de acesso baseado em papéis (RBAC)
 * @param  {...string} roles - Papéis permitidos para acessar o recurso
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Não autenticado',
        message: 'Autenticação necessária.'
      });
    }

    if (!roles.includes(req.user.role)) {
      logAudit({
        userId: req.user.id,
        action: 'ACCESS_DENIED',
        resource: req.originalUrl,
        details: `Papel "${req.user.role}" tentou acessar recurso restrito a: ${roles.join(', ')}`,
        ipAddress: req.ip,
        status: 'blocked'
      });

      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Você não tem permissão para acessar este recurso.'
      });
    }

    next();
  };
}

module.exports = { authenticate, authorize };
