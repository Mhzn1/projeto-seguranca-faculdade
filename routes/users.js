/**
 * =============================================
 * ROTAS DE GESTÃO DE USUÁRIOS
 * =============================================
 * - GET    /api/users          - Listar usuários (admin)
 * - GET    /api/users/profile  - Perfil do usuário logado
 * - PUT    /api/users/profile  - Atualizar perfil
 * - PUT    /api/users/:id/role - Alterar papel do usuário (admin)
 * - PUT    /api/users/:id/status - Ativar/desativar usuário (admin)
 * - DELETE /api/users/:id      - Excluir usuário (admin)
 * - GET    /api/users/audit-logs - Logs de auditoria (admin)
 */

const express = require('express');
const router = express.Router();

const { getDatabase } = require('../database/init');
const { encryptData, decryptData } = require('../utils/crypto');
const { logAudit, getAuditLogs } = require('../utils/logger');
const { authenticate, authorize } = require('../middleware/auth');
const { validateProfileUpdate } = require('../middleware/validator');

/**
 * GET /api/users
 * Lista todos os usuários (apenas para admins)
 * Dados sensíveis são descriptografados apenas para admins
 */
router.get('/', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDatabase();
    const users = db.prepare(`
      SELECT id, username, email, full_name_encrypted, role, is_active, 
             failed_login_attempts, last_login, created_at, updated_at
      FROM users ORDER BY created_at DESC
    `).all();

    // Descriptografar nomes para exibição admin
    const usersDecrypted = users.map(user => ({
      ...user,
      fullName: decryptData(user.full_name_encrypted) || 'Não informado',
      full_name_encrypted: undefined // Nunca retornar dados criptografados para o frontend
    }));

    logAudit({
      userId: req.user.id,
      action: 'LIST_USERS',
      resource: 'users',
      details: `Admin listou ${users.length} usuários`,
      ipAddress: req.ip,
      status: 'success'
    });

    res.json({ users: usersDecrypted });
  } catch (error) {
    console.error('[USERS] Erro ao listar usuários:', error.message);
    res.status(500).json({
      error: 'Erro interno',
      message: 'Erro ao listar usuários.'
    });
  }
});

/**
 * GET /api/users/profile
 * Retorna o perfil do usuário logado com dados descriptografados
 */
router.get('/profile', authenticate, (req, res) => {
  try {
    const db = getDatabase();
    const user = db.prepare(`
      SELECT id, username, email, full_name_encrypted, cpf_encrypted, phone_encrypted,
             role, last_login, created_at
      FROM users WHERE id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'Não encontrado',
        message: 'Usuário não encontrado.'
      });
    }

    // Descriptografar dados pessoais
    const profile = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: decryptData(user.full_name_encrypted) || '',
      cpf: decryptData(user.cpf_encrypted) || '',
      phone: decryptData(user.phone_encrypted) || '',
      role: user.role,
      lastLogin: user.last_login,
      createdAt: user.created_at
    };

    res.json({ profile });
  } catch (error) {
    console.error('[USERS] Erro ao buscar perfil:', error.message);
    res.status(500).json({
      error: 'Erro interno',
      message: 'Erro ao buscar perfil.'
    });
  }
});

/**
 * PUT /api/users/profile
 * Atualiza dados do perfil do usuário logado
 */
router.put('/profile', authenticate, validateProfileUpdate, (req, res) => {
  try {
    const db = getDatabase();
    const { fullName, phone, email } = req.body;

    // Verificar se e-mail já está em uso por outro usuário
    if (email) {
      const existing = db.prepare(
        'SELECT id FROM users WHERE email = ? AND id != ?'
      ).get(email, req.user.id);

      if (existing) {
        return res.status(409).json({
          error: 'Conflito',
          message: 'Este e-mail já está em uso por outro usuário.'
        });
      }
    }

    // Criptografar dados sensíveis antes de salvar
    const updates = {};
    if (fullName !== undefined) updates.full_name_encrypted = encryptData(fullName);
    if (phone !== undefined) updates.phone_encrypted = encryptData(phone);
    if (email !== undefined) updates.email = email;

    // Construir query dinamicamente
    const setClauses = [];
    const values = [];

    Object.entries(updates).forEach(([key, value]) => {
      setClauses.push(`${key} = ?`);
      values.push(value);
    });

    if (setClauses.length === 0) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: 'Nenhum campo para atualizar.'
      });
    }

    setClauses.push(`updated_at = datetime('now')`);
    values.push(req.user.id);

    db.prepare(`UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`).run(...values);

    logAudit({
      userId: req.user.id,
      action: 'PROFILE_UPDATED',
      resource: 'users',
      details: `Campos atualizados: ${Object.keys(updates).join(', ')}`,
      ipAddress: req.ip,
      status: 'success'
    });

    res.json({ message: 'Perfil atualizado com sucesso!' });
  } catch (error) {
    console.error('[USERS] Erro ao atualizar perfil:', error.message);
    res.status(500).json({
      error: 'Erro interno',
      message: 'Erro ao atualizar perfil.'
    });
  }
});

/**
 * PUT /api/users/:id/role
 * Altera o papel de um usuário (apenas admin)
 */
router.put('/:id/role', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDatabase();
    const { role } = req.body;
    const userId = parseInt(req.params.id);

    if (!['admin', 'user', 'moderator'].includes(role)) {
      return res.status(400).json({
        error: 'Papel inválido',
        message: 'Os papéis permitidos são: admin, user, moderator.'
      });
    }

    // Não permitir que admin altere seu próprio papel
    if (userId === req.user.id) {
      return res.status(400).json({
        error: 'Operação inválida',
        message: 'Você não pode alterar seu próprio papel.'
      });
    }

    const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'Não encontrado', message: 'Usuário não encontrado.' });
    }

    db.prepare(`UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?`).run(role, userId);

    logAudit({
      userId: req.user.id,
      action: 'ROLE_CHANGED',
      resource: 'users',
      details: `Papel de "${user.username}" alterado para "${role}"`,
      ipAddress: req.ip,
      status: 'success'
    });

    res.json({ message: `Papel do usuário alterado para "${role}".` });
  } catch (error) {
    console.error('[USERS] Erro ao alterar papel:', error.message);
    res.status(500).json({ error: 'Erro interno', message: 'Erro ao alterar papel do usuário.' });
  }
});

/**
 * PUT /api/users/:id/status
 * Ativa ou desativa um usuário (apenas admin)
 */
router.put('/:id/status', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDatabase();
    const { isActive } = req.body;
    const userId = parseInt(req.params.id);

    if (userId === req.user.id) {
      return res.status(400).json({
        error: 'Operação inválida',
        message: 'Você não pode desativar sua própria conta.'
      });
    }

    const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'Não encontrado', message: 'Usuário não encontrado.' });
    }

    db.prepare(`UPDATE users SET is_active = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(isActive ? 1 : 0, userId);

    // Se desativando, invalidar todas as sessões do usuário
    if (!isActive) {
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
    }

    logAudit({
      userId: req.user.id,
      action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      resource: 'users',
      details: `Usuário "${user.username}" ${isActive ? 'ativado' : 'desativado'}`,
      ipAddress: req.ip,
      status: 'success'
    });

    res.json({ message: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso.` });
  } catch (error) {
    console.error('[USERS] Erro ao alterar status:', error.message);
    res.status(500).json({ error: 'Erro interno', message: 'Erro ao alterar status do usuário.' });
  }
});

/**
 * DELETE /api/users/:id
 * Exclui um usuário (apenas admin)
 */
router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const db = getDatabase();
    const userId = parseInt(req.params.id);

    if (userId === req.user.id) {
      return res.status(400).json({
        error: 'Operação inválida',
        message: 'Você não pode excluir sua própria conta.'
      });
    }

    const user = db.prepare('SELECT id, username FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ error: 'Não encontrado', message: 'Usuário não encontrado.' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    logAudit({
      userId: req.user.id,
      action: 'USER_DELETED',
      resource: 'users',
      details: `Usuário "${user.username}" excluído permanentemente`,
      ipAddress: req.ip,
      status: 'success'
    });

    res.json({ message: 'Usuário excluído com sucesso.' });
  } catch (error) {
    console.error('[USERS] Erro ao excluir usuário:', error.message);
    res.status(500).json({ error: 'Erro interno', message: 'Erro ao excluir usuário.' });
  }
});

/**
 * GET /api/users/audit-logs
 * Consulta os logs de auditoria (apenas admin)
 */
router.get('/audit-logs', authenticate, authorize('admin'), (req, res) => {
  try {
    const { userId, action, limit = 50, offset = 0 } = req.query;

    const logs = getAuditLogs({
      userId: userId ? parseInt(userId) : null,
      action: action || null,
      limit: Math.min(parseInt(limit), 100), // Máximo 100 registros
      offset: parseInt(offset)
    });

    res.json({ logs, total: logs.length });
  } catch (error) {
    console.error('[USERS] Erro ao buscar logs:', error.message);
    res.status(500).json({ error: 'Erro interno', message: 'Erro ao buscar logs de auditoria.' });
  }
});

module.exports = router;
