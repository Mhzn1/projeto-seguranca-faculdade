const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#]).{8,}$/;

export type PasswordStrengthLevel = 'weak' | 'medium' | 'strong' | 'very-strong';

interface PasswordStrengthResult {
  level: PasswordStrengthLevel;
  score: number;
  label: string;
}

export const isStrongPassword = (password: string): boolean =>
  PASSWORD_REGEX.test(password);

export const getPasswordStrength = (password: string): PasswordStrengthResult => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[@$!%*?&#]/.test(password)) score++;

  if (score <= 1) return { level: 'weak', score: 25, label: 'Fraca' };
  if (score <= 2) return { level: 'medium', score: 50, label: 'Média' };
  if (score <= 3) return { level: 'strong', score: 75, label: 'Forte' };
  return { level: 'very-strong', score: 100, label: 'Muito Forte' };
};

export const formatCPF = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

export const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};
