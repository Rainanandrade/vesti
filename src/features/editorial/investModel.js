function buildInvestmentView(positions = []) {
  const total = positions.reduce((sum, position) => sum + Math.max(0, Number(position.current) || 0), 0);
  const normalized = positions.map((position) => ({ ...position, share: total ? Math.round((Math.max(0, Number(position.current) || 0) / total) * 1000) / 10 : 0 })).sort((a, b) => b.current - a.current);
  const classes = Object.values(positions.reduce((groups, position) => {
    const key = position.type || 'outros';
    groups[key] = groups[key] || { label: key, value: 0 };
    groups[key].value += Math.max(0, Number(position.current) || 0);
    return groups;
  }, {}));
  const topHolding = normalized[0] || { symbol: '', current: 0, share: 0 };
  return { total, positions: normalized, classes, topHolding, needsAttention: topHolding.share >= 25 };
}
module.exports = { buildInvestmentView };
