function cleanPosition(position) {
  const quantity = Math.max(0, Number(position.quantity) || 0);
  return { quantity, avgPrice: quantity > 0 ? Math.max(0, Number(position.avgPrice) || 0) : 0 };
}

function undo(position, operation) {
  if (operation.type === 'sell') {
    return { quantity: position.quantity + operation.quantity, avgPrice: position.avgPrice || operation.price };
  }
  if (operation.quantity > position.quantity + 1e-9) {
    throw new Error('Não é seguro excluir esta compra: a quantidade já não existe na posição atual. Revise vendas posteriores primeiro.');
  }
  const quantity = position.quantity - operation.quantity;
  if (quantity <= 1e-9) return { quantity: 0, avgPrice: 0 };
  const remainingCost = (position.quantity * position.avgPrice) - (operation.quantity * operation.price) - (operation.fees || 0);
  return { quantity, avgPrice: Math.max(0, remainingCost / quantity) };
}

function apply(position, operation) {
  if (operation.assetType === 'daytrade') return position;
  if (operation.type === 'sell') {
    if (operation.quantity > position.quantity + 1e-9) throw new Error('A venda editada excede a posição disponível.');
    const quantity = position.quantity - operation.quantity;
    return { quantity: Math.max(0, quantity), avgPrice: quantity > 1e-9 ? position.avgPrice : 0 };
  }
  const quantity = position.quantity + operation.quantity;
  const cost = (position.quantity * position.avgPrice) + (operation.quantity * operation.price) + (operation.fees || 0);
  return { quantity, avgPrice: quantity > 0 ? cost / quantity : 0 };
}

function compareOperations(a, b) {
  const byDate = String(a.date || '').localeCompare(String(b.date || ''));
  if (byDate !== 0) return byDate;
  const byCreatedAt = (Number(a.createdAt) || 0) - (Number(b.createdAt) || 0);
  if (byCreatedAt !== 0) return byCreatedAt;
  return String(a.id || '').localeCompare(String(b.id || ''));
}

/**
 * Deriva a posição-base removendo o ledger atual em ordem inversa e então
 * reaplica o ledger desejado em ordem cronológica. Isso preserva o preço médio
 * quando uma operação antiga é editada/excluída e há compras posteriores.
 */
function rebuildPositionFromOperations(current, previousOperations, nextOperations) {
  let baseline = cleanPosition(current);
  const previous = [...previousOperations]
    .filter((operation) => operation.assetType !== 'daytrade')
    .sort(compareOperations);
  for (let index = previous.length - 1; index >= 0; index -= 1) {
    baseline = cleanPosition(undo(baseline, previous[index]));
  }

  let result = baseline;
  const next = [...nextOperations]
    .filter((operation) => operation.assetType !== 'daytrade')
    .sort(compareOperations);
  for (const operation of next) result = cleanPosition(apply(result, operation));
  return result;
}

/** Reverte o movimento antigo e aplica o novo sobre a posição atual. */
function reconcilePositionMutation(current, previous, next) {
  const base = undo(cleanPosition(current), previous);
  return cleanPosition(next ? apply(base, next) : base);
}

module.exports = { reconcilePositionMutation, rebuildPositionFromOperations };
