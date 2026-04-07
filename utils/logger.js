/**
 * =============================================
 * MÓDULO DE LOG DE AUDITORIA
 * =============================================
 * - Registro de todas as ações do sistema
 * - Logs de segurança (tentativas de login, acessos)
 * - Nunca registra dados sensíveis em texto plano
 */

const { getDatabase } = require('../database/init');
const { maskSensitiveData } = require('./crypto');

/**
 * Registra uma ação no log de auditoria
 * @param {Object} params - Parâmetros do log
 * @param {number} params.userId - ID do usuário (null se não autenticado)
 * @param {string} params.action - Ação realizada (LOGIN, REGISTER, UPDATE, DELETE, etc.)
 * @param {string} params.resource - Recurso acessado
 * @param {string} params.details - Detalhes adicionais (sem dados sensíveis)
 * @param {string} params.ipAddress - Endereço IP do cliente
 * @param {string} params.status - Status: 'success', 'failure', 'blocked'
 */
function logAudit({ userId = null, action, resource = null, details = null, ipAddress = null, status }) {
  try {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, resource, details, ip_address, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, action, resource, details, ipAddress, status);
  } catch (error) {
    // Log de auditoria nunca deve derrubar o sistema
    console.error('[AUDIT] Erro ao registrar log:', error.message);
  }
}

/**
 * Consulta os logs de auditoria com filtros
 */
function getAuditLogs({ userId = null, action = null, limit = 50, offset = 0 }) {
  try {
    const db = getDatabase();
    let query = `
      SELECT al.*, u.username 
      FROM audit_logs al 
      LEFT JOIN users u ON al.user_id = u.id 
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      query += ' AND al.user_id = ?';
      params.push(userId);
    }
    if (action) {
      query += ' AND al.action = ?';
      params.push(action);
    }

    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    return db.prepare(query).all(...params);
  } catch (error) {
    console.error('[AUDIT] Erro ao consultar logs:', error.message);
    return [];
  }
}

module.exports = { logAudit, getAuditLogs };
