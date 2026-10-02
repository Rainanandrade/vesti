function selectOwnedWallet(wallets, userId, activeWalletId) {
  const owned = (wallets || []).filter((wallet) => wallet.ownerId === userId && !wallet.readOnly);
  return owned.find((wallet) => wallet.id === activeWalletId) || owned[0] || null;
}

function mapRecoveryWallet(row, userId) {
  return {
    id: row.id,
    name: row.name || 'Carteira principal',
    assets: [],
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    ownerId: userId,
    readOnly: false,
  };
}

module.exports = { selectOwnedWallet, mapRecoveryWallet };
