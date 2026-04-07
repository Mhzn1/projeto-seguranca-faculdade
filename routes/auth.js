/**
 * =============================================
 * ROTAS DE AUTENTICAÇÃO
 * =============================================
 * - POST /api/auth/register  - Registro de novo usuário
 * - POST /api/auth/login     - Login com credenciais
 * - POST /api/auth/logout    - Encerramento de sessão
 * - POST /api/auth/change-password - Alteração de senha
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const { getDatabase } = require('../database/init');
const { encryptData, hashToken } = require('../utils/crypto');
const { logAudit } = require('../utils/logger');
const { authenticate } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validator');
const { authLimiter, sensitiveLimiter } = require('../middleware/rateLimiter');

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MINUTES = 30;

/**
 * POST /api/auth/register
 * Registro de novo usuário com dados criptografados
 */
router.post('/register', authLimiter, validateRegistration, (req, res) => {
  try {
    const db = getDatabase();
    const { username, email, password, fullName, cpf, phone } = req.body;

    // Verificar se usuário ou e-mail já existem
    const existing = db.prepare(
      'SELECT id FROM users WHERE username = ? OR email = ?'
    ).get(username, email);

    if (existing) {
      logAudit({
        action: 'REGISTER_DUPLICATE',
        details: `Tentativa de registro com username/email já existente: ${username}`,
        ipAddress: req.ip,
        status: 'failure'
      });
      return res.status(409).json({
        error: 'Conflito',
        message: 'Nome de usuário ou e-mail já cadastrado.'
      });
    }

    // Hash da senha com bcrypt (custo 12)
    const salt = bcrypt.genSaltSync(12);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Criptografar dados sensíveis (PII)
    const fullNameEncrypted = encryptData(fullName);
    const cpfEncrypted = encryptData(cpf);
    const phoneEncrypted = encryptData(phone);

    // Inserir usuário no banco
    const result = db.prepare(`
      INSERT INTO users (username, email, password_hash, full_name_encrypted, cpf_encrypted, phone_encrypted, role)
      VALUES (?, ?, ?, ?, ?, ?, 'user')
    `).run(username, email, passwordHash, fullNameEncrypted, cpfEncrypted, phoneEncrypted);

    logAudit({
      userId: result.lastInsertRowid,
      action: 'REGISTER',
      resource: 'users',
      details: `Novo usuário registrado: ${username}`,
      ipAddress: req.ip,
      status: 'success'
    });

    res.status(201).json({
      message: 'Usuário registrado com sucesso!',
      user: {
        id: result.lastInsertRowid,
        username,
        role: 'user'
      }
    });
  } catch (error) {
    console.error('[AUTH] Erro no registro:', error.message);
    res.status(500).json({
      error: 'Erro interno',
      message: 'Não foi possível processar o registro. Tente novamente.'
    });
  }
});

/**
 * POST /api/auth/login
 * Autenticação com proteção contra força bruta
 */
router.post('/login', authLimiter, validateLogin, (req, res) => {
  try {
    const db = getDatabase();
    const { username, password } = req.body;

    // Buscar usuário
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user) {
      logAudit({
        action: 'LOGIN_FAILED',
        details: `Tentativa de login com usuário inexistente: ${username}`,
        ipAddress: req.ip,
        status: 'failure'
      });
      // Mensagem genérica para não revelar se o usuário existe
      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'Usuário ou senha incorretos.'
      });
    }

    // Verificar se a conta está bloqueada
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      logAudit({
        userId: user.id,
        action: 'LOGIN_BLOCKED',
        details: `Conta bloqueada até ${user.locked_until}`,
        ipAddress: req.ip,
        status: 'blocked'
      });
      return res.status(423).json({
        error: 'Conta bloqueada',
        message: `Sua conta está temporariamente bloqueada por excesso de tentativas. Tente novamente após ${LOCK_TIME_MINUTES} minutos.`
      });
    }

    // Verificar se a conta está ativa
    if (!user.is_active) {
      return res.status(403).json({
        error: 'Conta desativada',
        message: 'Sua conta foi desativada. Contate o administrador.'
      });
    }

    // Verificar senha
    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);

    if (!isPasswordValid) {
      // Incrementar tentativas falhadas
      const newAttempts = (user.failed_login_attempts || 0) + 1;

      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        // Bloquear conta
        const lockUntil = new Date(Date.now() + LOCK_TIME_MINUTES * 60 * 1000).toISOString();
        db.prepare(
          'UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?'
        ).run(newAttempts, lockUntil, user.id);

        logAudit({
          userId: user.id,
          action: 'ACCOUNT_LOCKED',
          details: `Conta bloqueada após ${MAX_FAILED_ATTEMPTS} tentativas falhadas`,
          ipAddress: req.ip,
          status: 'blocked'
        });

        return res.status(423).json({
          error: 'Conta bloqueada',
          message: `Conta bloqueada por ${LOCK_TIME_MINUTES} minutos após ${MAX_FAILED_ATTEMPTS} tentativas falhadas.`
        });
      }

      db.prepare(
        'UPDATE users SET failed_login_attempts = ? WHERE id = ?'
      ).run(newAttempts, user.id);

      logAudit({
        userId: user.id,
        action: 'LOGIN_FAILED',
        details: `Senha incorreta (tentativa ${newAttempts}/${MAX_FAILED_ATTEMPTS})`,
        ipAddress: req.ip,
        status: 'failure'
      });

      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'Usuário ou senha incorretos.',
        remainingAttempts: MAX_FAILED_ATTEMPTS - newAttempts
      });
    }

    // Login bem-sucedido - resetar tentativas falhadas
    db.prepare(
      `UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login = datetime('now') WHERE id = ?`
    ).run(user.id);

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    // Armazenar sessão com hash do token (nunca em texto plano)
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO sessions (user_id, token_hash, ip_address, user_agent, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(user.id, tokenHash, req.ip, req.headers['user-agent'], expiresAt);

    logAudit({
      userId: user.id,
      action: 'LOGIN',
      resource: 'sessions',
      details: 'Login bem-sucedido',
      ipAddress: req.ip,
      status: 'success'
    });

    res.json({
      message: 'Login realizado com sucesso!',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        lastLogin: user.last_login
      }
    });
  } catch (error) {
    console.error('[AUTH] Erro no login:', error.message);
    res.status(500).json({
      error: 'Erro interno',
      message: 'Não foi possível processar o login. Tente novamente.'
    });
  }
});

/**
 * POST /api/auth/logout
 * Encerramento seguro de sessão
 */
router.post('/logout', authenticate, (req, res) => {
  try {
    const db = getDatabase();
    const tokenHash = hashToken(req.token);

    // Remover sessão do banco
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);

    logAudit({
      userId: req.user.id,
      action: 'LOGOUT',
      resource: 'sessions',
      details: 'Sessão encerrada pelo usuário',
      ipAddress: req.ip,
      status: 'success'
    });

    res.json({ message: 'Sessão encerrada com sucesso.' });
  } catch (error) {
    console.error('[AUTH] Erro no logout:', error.message);
    res.status(500).json({
      error: 'Erro interno',
      message: 'Erro ao encerrar sessão.'
    });
  }
});

/**
 * POST /api/auth/change-password
 * Alteração de senha com verificação da senha atual
 */
router.post('/change-password', authenticate, sensitiveLimiter, (req, res) => {
  try {
    const db = getDatabase();
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: 'Senha atual e nova senha são obrigatórias.'
      });
    }

    // Validar nova senha
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Senha fraca',
        message: 'A nova senha deve ter no mínimo 8 caracteres.'
      });
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/.test(newPassword)) {
      return res.status(400).json({
        error: 'Senha fraca',
        message: 'A nova senha deve conter maiúscula, minúscula, número e caractere especial.'
      });
    }

    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);

    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      logAudit({
        userId: req.user.id,
        action: 'PASSWORD_CHANGE_FAILED',
        details: 'Senha atual incorreta',
        ipAddress: req.ip,
        status: 'failure'
      });
      return res.status(401).json({
        error: 'Senha incorreta',
        message: 'A senha atual informada está incorreta.'
      });
    }

    const salt = bcrypt.genSaltSync(12);
    const newPasswordHash = bcrypt.hashSync(newPassword, salt);

    db.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(newPasswordHash, req.user.id);

    // Invalidar todas as outras sessões por segurança
    const currentTokenHash = hashToken(req.token);
    db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?')
      .run(req.user.id, currentTokenHash);

    logAudit({
      userId: req.user.id,
      action: 'PASSWORD_CHANGED',
      resource: 'users',
      details: 'Senha alterada com sucesso. Outras sessões foram encerradas.',
      ipAddress: req.ip,
      status: 'success'
    });

    res.json({ message: 'Senha alterada com sucesso! Outras sessões foram encerradas.' });
  } catch (error) {
    console.error('[AUTH] Erro na alteração de senha:', error.message);
    res.status(500).json({
      error: 'Erro interno',
      message: 'Erro ao alterar senha.'
    });
  }
});

module.exports = router;
