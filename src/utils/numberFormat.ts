// Formatação automática de input de moeda enquanto o usuário digita.
// Ex: usuário digita "12345" → mostra "123,45". Digita "1234567" → "12.345,67"

export function formatCurrencyInput(value: string): string {
  // Remove tudo que não é dígito
  const digits = value.replace(/\D/g, '');
  if (digits === '') return '';
  // Limita pra não estourar (max 13 dígitos = 99 bilhões)
  const trimmed = digits.slice(0, 13);
  // Garante pelo menos 3 dígitos (pra ter centavos)
  const padded = trimmed.padStart(3, '0');
  const cents = padded.slice(-2);
  const reais = padded.slice(0, -2);
  // Remove zeros à esquerda dos reais mas preserva pelo menos 1
  const reaisClean = reais.replace(/^0+/, '') || '0';
  // Adiciona separador de milhar
  const reaisFormatted = reaisClean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${reaisFormatted},${cents}`;
}

// Converte string formatada de volta pra número
export function parseFormattedNumber(formatted: string): number {
  if (!formatted) return 0;
  const cleaned = formatted.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isFinite(n) ? n : 0;
}

// Formata um número como inteiro de quantidade (sem decimais)
export function formatQuantityInput(value: string): string {
  // Aceita ponto OU vírgula como decimal
  const cleaned = value.replace(/[^\d,.]/g, '');
  // Substitui vírgula por ponto pra parse
  const normalized = cleaned.replace(',', '.');
  // Aceita apenas 1 ponto
  const parts = normalized.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  return normalized.replace('.', ',');
}

export function parseQuantity(formatted: string): number {
  if (!formatted) return 0;
  const n = parseFloat(formatted.replace(',', '.'));
  return isFinite(n) ? n : 0;
}
