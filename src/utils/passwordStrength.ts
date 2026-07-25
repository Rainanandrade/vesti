// Avalia força de senha e retorna violações claras pro usuário.

export type PasswordCheck = {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  score: number;              // 0-100
  issues: string[];
};

const COMMON_PASSWORDS = new Set([
  '12345678', '123456789', 'password', 'senha1234', 'qwerty123',
  'admin1234', 'abcd1234', '11111111', 'letmein12', 'welcome12',
]);

export function checkPassword(pwd: string): PasswordCheck {
  const issues: string[] = [];

  if (pwd.length < 8) issues.push('Pelo menos 8 caracteres');
  if (!/[A-Z]/.test(pwd)) issues.push('Uma letra maiúscula (A-Z)');
  if (!/[a-z]/.test(pwd)) issues.push('Uma letra minúscula (a-z)');
  if (!/[0-9]/.test(pwd)) issues.push('Um número (0-9)');
  if (COMMON_PASSWORDS.has(pwd.toLowerCase())) {
    issues.push('Não use senhas óbvias tipo "12345678" ou "password"');
  }

  let score = 0;
  if (pwd.length >= 8) score += 25;
  if (pwd.length >= 12) score += 15;
  if (/[A-Z]/.test(pwd)) score += 15;
  if (/[a-z]/.test(pwd)) score += 10;
  if (/[0-9]/.test(pwd)) score += 15;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 20; // bonus por símbolo

  const strength: 'weak' | 'medium' | 'strong' =
    score < 50 ? 'weak' : score < 80 ? 'medium' : 'strong';

  return {
    isValid: issues.length === 0,
    strength,
    score: Math.min(100, score),
    issues,
  };
}
