// Sempre volta pra raiz da aba Carteira, evitando o bug do react-navigation
// no web onde goBack() sai da tab atual e cai no Dashboard.
export function safeBackToCarteira(navigation: any) {
  const parent = navigation?.getParent?.();
  if (parent) parent.navigate('Carteira', { screen: 'PortfolioMain' });
  else if (navigation?.navigate) navigation.navigate('PortfolioMain');
}

// Pra modais que vivem no MainStack (DividendTarget, Settings, AIHub):
// tenta goBack primeiro; se não tem histórico, volta pra última aba ativa.
export function safeBackToTabs(navigation: any) {
  if (navigation?.canGoBack?.()) {
    navigation.goBack();
    return;
  }
  // navigation aqui é do MainStack — Tabs está no mesmo nível
  if (navigation?.navigate) navigation.navigate('Tabs');
}
