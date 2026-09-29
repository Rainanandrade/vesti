const MAX_AI_TEXT = 8_000;
const ALLOWED_CLASSES = new Set(['renda_fixa', 'renda_variavel', 'internacional']);

function boundedString(value, field, max) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} inválido`);
  const clean = value.trim();
  if (clean.length > max) throw new Error(`${field} excede o limite`);
  return clean;
}

export function validateAiText(value, maxLength = MAX_AI_TEXT) {
  try {
    return boundedString(value, 'Resposta da IA', maxLength);
  } catch (error) {
    if (String(error?.message).includes('limite')) throw error;
    throw new Error('Resposta da IA inválida');
  }
}

export function normalizeAllocationResponse(payload, expectedAmount, allowedSymbols) {
  if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
    throw new Error('Valor esperado inválido');
  }
  if (!payload || !Array.isArray(payload.picks) || payload.picks.length < 1 || payload.picks.length > 6) {
    throw new Error('picks inválidos');
  }

  const summary = boundedString(payload.summary, 'summary', 1_000);
  const rawAmounts = payload.picks.map((pick) => Number(pick?.amount));
  if (rawAmounts.some((amount) => !Number.isFinite(amount))) throw new Error('amount deve ser finito');
  if (rawAmounts.some((amount) => amount < 0)) throw new Error('amount deve ser positivo');
  const rawTotal = rawAmounts.reduce((sum, amount) => sum + amount, 0);
  if (rawTotal <= 0) throw new Error('A soma das alocações é zero');

  const picks = payload.picks.map((pick) => {
    const amount = Number(pick?.amount);

    const symbol = boundedString(pick.symbol, 'symbol', 80);
    if (!allowedSymbols?.has(symbol)) throw new Error('Ativo fora da lista permitida');
    const classKey = boundedString(pick.classKey, 'classKey', 30);
    if (!ALLOWED_CLASSES.has(classKey)) throw new Error('classKey inválido');

    return {
      classKey,
      classLabel: boundedString(pick.classLabel, 'classLabel', 40),
      role: boundedString(pick.role, 'role', 120),
      symbol,
      name: boundedString(pick.name, 'name', 120),
      amount,
      reasoning: boundedString(pick.reasoning, 'reasoning', 1_200),
    };
  });

  const total = picks.reduce((sum, pick) => sum + pick.amount, 0);

  const normalized = picks.map((pick) => ({
    ...pick,
    amount: Math.round((pick.amount * expectedAmount * 100) / total) / 100,
  }));
  const roundedTotal = normalized.reduce((sum, pick) => sum + pick.amount, 0);
  normalized[normalized.length - 1].amount = Math.round(
    (normalized[normalized.length - 1].amount + expectedAmount - roundedTotal) * 100,
  ) / 100;
  if (normalized.some((pick) => !Number.isFinite(pick.amount) || pick.amount <= 0)) {
    throw new Error('Alocação normalizada inválida');
  }

  return { summary, picks: normalized };
}
