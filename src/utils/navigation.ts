// Sempre volta pra raiz da aba Carteira, evitando o bug do react-navigation
// no web onde goBack() sai da tab atual e cai no Dashboard.
export function safeBackToCarteira(navigation: any) {
  const routes: string[] = navigation?.getState?.()?.routeNames || [];
  if (routes.includes('PortfolioMain')) navigation.navigate('PortfolioMain');
  else if (navigation?.navigate) navigation.navigate('Tabs', { screen: 'Investir', params: { screen: 'PortfolioMain' } });
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

// O simulador de aporte vive no MainStack e deve sempre fechar no início de Investir.
export function safeBackToInvestir(navigation: any) {
  if (navigation?.navigate) navigation.navigate('Tabs', { screen: 'Investir', params: { screen: 'PortfolioMain' } });
}
