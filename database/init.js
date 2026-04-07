/**
 * =============================================
 * INICIALIZAÇÃO DO BANCO DE DADOS
 * =============================================
 * - Criação segura das tabelas
 * - Prepared statements para prevenir SQL Injection
 * - Armazenamento de logs de auditoria
 */

const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'secure_system.db');

let db;

function getDatabase() {
  if (!db) {
    db = new Database(DB_PATH);

    // Habilitar WAL mode para melhor performance e segurança
    db.pragma('journal_mode = WAL');
    // Habilitar foreign keys
    db.pragma('foreign_keys = ON');

    initializeTables();
    seedAdminUser();
  }
  return db;
}

function initializeTables() {
  db.exec(`
    -- Tabela de usuários com campos criptografados
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name_encrypted TEXT,
      cpf_encrypted TEXT,
      phone_encrypted TEXT,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user', 'moderator')),
      is_active INTEGER NOT NULL DEFAULT 1,
      failed_login_attempts INTEGER DEFAULT 0,
      locked_until DATETIME,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabela de sessões ativas (para invalidação de tokens)
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Tabela de logs de auditoria (registro de todas as ações)
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      resource TEXT,
      details TEXT,
      ip_address TEXT,
      status TEXT NOT NULL CHECK(status IN ('success', 'failure', 'blocked')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Índices para otimização de consultas
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
  `);
}

function seedAdminUser() {
  const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');

  if (!existingAdmin) {
    const salt = bcrypt.genSaltSync(12);
    const passwordHash = bcrypt.hashSync('Admin@123', salt);

    db.prepare(`
      INSERT INTO users (username, email, password_hash, role, full_name_encrypted)
      VALUES (?, ?, ?, 'admin', ?)
    `).run('admin', 'admin@sistema.com', passwordHash, 'Administrador do Sistema');

    console.log('✅ Usuário admin criado (senha: Admin@123)');
  }
}

module.exports = { getDatabase };
