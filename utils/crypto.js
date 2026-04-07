/**
 * =============================================
 * MÓDULO DE CRIPTOGRAFIA
 * =============================================
 * - Criptografia AES-256 para dados sensíveis
 * - Funções de encrypt/decrypt para campos PII
 * - Hash de tokens para armazenamento seguro
 */

const CryptoJS = require('crypto-js');
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_key_change_in_production';

/**
 * Criptografa dados sensíveis usando AES-256
 * Utilizado para campos como CPF, telefone, nome completo
 */
function encryptData(plainText) {
  if (!plainText) return null;
  try {
    const encrypted = CryptoJS.AES.encrypt(plainText, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('[CRYPTO] Erro ao criptografar dados:', error.message);
    return null;
  }
}

/**
 * Descriptografa dados sensíveis
 */
function decryptData(encryptedText) {
  if (!encryptedText) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || null;
  } catch (error) {
    console.error('[CRYPTO] Erro ao descriptografar dados:', error.message);
    return null;
  }
}

/**
 * Gera hash SHA-256 de um token para armazenamento seguro
 * Tokens nunca são armazenados em texto plano no banco
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Mascara dados sensíveis para exibição em logs
 * Ex: "123.456.789-00" -> "***.***.789-00"
 */
function maskSensitiveData(data, type = 'generic') {
  if (!data) return '***';

  switch (type) {
    case 'cpf':
      return data.replace(/^(\d{3})\.(\d{3})/, '***. ***');
    case 'email':
      const [user, domain] = data.split('@');
      return `${user.substring(0, 2)}***@${domain}`;
    case 'phone':
      return data.replace(/^(.{4})/, '****');
    default:
      return data.substring(0, 3) + '***';
  }
}

module.exports = { encryptData, decryptData, hashToken, maskSensitiveData };
