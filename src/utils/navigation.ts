// Sempre volta pra raiz da aba Carteira, evitando o bug do react-navigation
// no web onde goBack() sai da tab atual e cai no Dashboard.
export function safeBackToCarteira(navigation: any) {
  const parent = navigation?.getParent?.();
  if (parent) parent.navigate('Carteira', { screen: 'PortfolioMain' });
  else if (navigation?.navigate) navigation.navigate('PortfolioMain');
}
