/**
 * =============================================
 * MIDDLEWARE DE VALIDAÇÃO DE ENTRADAS
 * =============================================
 * - Sanitização de inputs contra XSS
 * - Validação de formatos (email, CPF, senhas)
 * - Prevenção de injeção de código
 */

const validatorLib = require('validator');

/**
 * Sanitiza uma string removendo caracteres perigosos (XSS)
 */
function sanitize(input) {
  if (typeof input !== 'string') return input;
  return validatorLib.escape(validatorLib.trim(input));
}

/**
 * Validação de registro de usuário
 */
function validateRegistration(req, res, next) {
  const { username, email, password, fullName, cpf, phone } = req.body;
  const errors = [];

  // Validar username
  if (!username || username.length < 3 || username.length > 30) {
    errors.push('Nome de usuário deve ter entre 3 e 30 caracteres.');
  }
  if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Nome de usuário deve conter apenas letras, números e underscore.');
  }

  // Validar e-mail
  if (!email || !validatorLib.isEmail(email)) {
    errors.push('E-mail inválido.');
  }

  // Validar senha forte
  if (!password || password.length < 8) {
    errors.push('Senha deve ter no mínimo 8 caracteres.');
  }
  if (password && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/.test(password)) {
    errors.push('Senha deve conter: maiúscula, minúscula, número e caractere especial (@$!%*?&#).');
  }

  // Validar nome completo (se fornecido)
  if (fullName && fullName.length > 100) {
    errors.push('Nome completo deve ter no máximo 100 caracteres.');
  }

  // Validar CPF (formato básico - se fornecido)
  if (cpf && !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf) && !/^\d{11}$/.test(cpf)) {
    errors.push('CPF deve estar no formato XXX.XXX.XXX-XX ou conter 11 dígitos.');
  }

  // Validar telefone (se fornecido)
  if (phone && !/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(phone)) {
    errors.push('Telefone deve estar no formato (XX) XXXXX-XXXX.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Dados inválidos',
      messages: errors
    });
  }

  // Sanitizar os campos de texto
  req.body.username = sanitize(username);
  req.body.email = validatorLib.normalizeEmail(email);
  req.body.fullName = fullName ? sanitize(fullName) : null;

  next();
}

/**
 * Validação de login
 */
function validateLogin(req, res, next) {
  const { username, password } = req.body;
  const errors = [];

  if (!username || username.length === 0) {
    errors.push('Nome de usuário é obrigatório.');
  }
  if (!password || password.length === 0) {
    errors.push('Senha é obrigatória.');
  }

  // Verificar tamanho máximo para prevenir ataques de DoS via hash
  if (password && password.length > 128) {
    errors.push('Senha excede o tamanho máximo permitido.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Dados inválidos',
      messages: errors
    });
  }

  req.body.username = sanitize(username);
  next();
}

/**
 * Validação de atualização de perfil
 */
function validateProfileUpdate(req, res, next) {
  const { fullName, phone, email } = req.body;
  const errors = [];

  if (email && !validatorLib.isEmail(email)) {
    errors.push('E-mail inválido.');
  }
  if (fullName && fullName.length > 100) {
    errors.push('Nome completo deve ter no máximo 100 caracteres.');
  }
  if (phone && !/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(phone)) {
    errors.push('Telefone inválido.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Dados inválidos',
      messages: errors
    });
  }

  if (fullName) req.body.fullName = sanitize(fullName);
  if (email) req.body.email = validatorLib.normalizeEmail(email);

  next();
}

module.exports = { validateRegistration, validateLogin, validateProfileUpdate, sanitize };
