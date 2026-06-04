export const fmtBRL = (n: number, hidden = false): string => {
  if (hidden) return 'R$ •••••';
  return n.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const fmtPct = (n: number, hidden = false): string => {
  if (hidden) return '•••%';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
};

export const fmtNumber = (n: number, hidden = false): string => {
  if (hidden) return '•••';
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
};

export const fmtCompactBRL = (n: number, hidden = false): string => {
  if (hidden) return 'R$ •••';
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `R$ ${(n / 1_000).toFixed(1)}k`;
  return fmtBRL(n);
};
