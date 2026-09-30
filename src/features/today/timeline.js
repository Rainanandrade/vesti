function buildTodayTimeline({ operations = [], proventos = [], month, limit = 6 }) {
  const opItems = operations.filter((item) => item.date && item.date.startsWith(month)).map((item) => ({ id: `operation:${item.id}`, date: item.date, title: item.type === 'buy' ? `Você investiu em ${item.symbol}` : `Venda de ${item.symbol}`, amount: (item.type === 'buy' ? -1 : 1) * Number(item.quantity || 0) * Number(item.price || 0), detail: `${Number(item.quantity || 0)} cotas/ações`, icon: item.type === 'buy' ? 'add-circle-outline' : 'swap-horizontal-outline', tone: 'neutral' }));
  const proceeds = proventos.filter((item) => item.date && item.date.startsWith(month)).map((item) => ({ id: `provento:${item.id}`, date: item.date, title: `Provento de ${item.symbol || 'investimento'}`, amount: Number(item.amount || 0), detail: item.kind === 'jcp' ? 'Juros sobre capital próprio' : 'Rendimento recebido', icon: 'cash-outline', tone: 'positive' }));
  return [...opItems, ...proceeds].sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}
module.exports = { buildTodayTimeline };
