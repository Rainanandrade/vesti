const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('Orbit tokens replace the Pulso and legacy identities', () => {
  const tokens = read('src/theme/tokens.ts');
  assert.match(tokens, /canvas:\s*'#11131B'/i);
  assert.match(tokens, /brand:\s*'#7C5CFF'/i);
  assert.match(tokens, /accent:\s*'#FF786B'/i);
  assert.doesNotMatch(tokens, /#0B5345|#C9A961|#F5F0E8|#5B4CF0|#FF655B/i);
});

test('main navigation exposes exactly four approved destinations', () => {
  const navigator = read('src/navigation/RootNavigator.tsx');
  for (const name of ['Hoje', 'Investir', 'Planejar', 'Aprender']) {
    assert.match(navigator, new RegExp(`name=["']${name}["']`));
  }
  assert.doesNotMatch(navigator, /name=["']Aportar["']/);
  assert.doesNotMatch(navigator, /name=["']Metas["']/);
});

test('contextual assistant is accessible by name', () => {
  const prompt = read('src/ui/VestiPrompt.tsx');
  assert.match(prompt, /accessibilityLabel/);
  assert.match(prompt, /Pergunte ao Vesti/);
});

test('Investir consolidates portfolio activity and shared read-only state', () => {
  const portfolio = read('src/screens/PortfolioScreen.tsx');
  for (const label of ['Posições', 'Rendimentos', 'Movimentos']) assert.match(portfolio, new RegExp(label));
  assert.match(portfolio, /somente leitura/i);
});

test('aporte is one tap from Investir and every investment flow returns to Investir', () => {
  const portfolio = read('src/screens/PortfolioScreen.tsx');
  const aporte = read('src/screens/AporteScreen.tsx');
  const navigation = read('src/utils/navigation.ts');
  const tabs = read('src/components/AdaptiveTabBar.tsx');
  assert.match(portfolio, /Sugerir meu aporte/);
  assert.match(portfolio, /navigate\('Aporte'\)/);
  assert.match(aporte, /safeBackToInvestir\(navigation\)/);
  assert.match(navigation, /screen: 'Investir'/);
  assert.doesNotMatch(navigation, /navigate\('Carteira'/);
  assert.doesNotMatch(read('src/screens/AssetsListScreen.tsx'), /screen: 'Carteira'/);
  assert.match(tabs, /PortfolioMain/);
});

test('goals has a working return action and AI screens are not visually paywalled', () => {
  const goals = read('src/screens/GoalsScreen.tsx');
  assert.match(goals, /safeBackToTabs\(navigation\)/);
  for (const file of ['AIHubScreen.tsx', 'IAConsultorScreen.tsx']) {
    assert.doesNotMatch(read(`src/screens/${file}`), /<ProLock/);
  }
});

test('aporte explains and enforces profile plus investment focus', () => {
  const aporte = read('src/screens/AporteScreen.tsx');
  const allocation = read('src/utils/allocation.ts');
  const aiSuggestion = read('api/ai-suggest.js');
  assert.match(aporte, /PREFERENCE_INFO/);
  assert.match(aporte, /Sugestão baseada no seu perfil/);
  assert.match(allocation, /isAlignedWithPreference/);
  assert.match(aiSuggestion, /FOCUS_UNIVERSE/);
  assert.match(aiSuggestion, /profile\.preference/);
});

test('asset creation cannot keep a loading state forever', () => {
  const context = read('src/context/AppContext.tsx');
  const addAsset = read('src/screens/AddAssetScreen.tsx');
  const aporte = read('src/screens/AporteScreen.tsx');
  assert.match(context, /withTimeout\(/);
  assert.match(addAsset, /finally\(\(\) =>/);
  assert.match(aporte, /\.finally\(\(\) => \{/);
  assert.match(aporte, /setLoading\(false\)/);
});

test('clearing financial data recreates an active main wallet before replacing local state', () => {
  const context = read('src/context/AppContext.tsx');
  assert.match(context, /ensureActiveWallet/);
  assert.match(context, /walletsRef/);
  assert.match(context, /ownedWallets/);
  assert.match(context, /Carteira principal/);
  assert.match(context, /setActiveWalletIdState\(recoveryWallet\.id\)/);
  assert.match(context, /withTimeout/);
});

test('owned positions expose a visible editing path', () => {
  const detail = read('src/screens/AssetDetailScreen.tsx');
  assert.match(detail, /Editar posição/);
  assert.match(detail, /screen: 'EditAsset'/);
  assert.match(detail, /readOnly/);
});

test('Hoje metrics and timeline connect to concrete destinations', () => {
  const dashboard = read('src/screens/DashboardScreen.tsx');
  const signals = read('src/features/today/TodaySignals.tsx');
  const timeline = read('src/features/today/TodayTimeline.tsx');
  assert.match(dashboard, /onOpenPortfolio/);
  assert.match(dashboard, /onOpenAporte/);
  assert.match(dashboard, /onOpenIncome/);
  assert.match(signals, /onPress/);
  assert.match(timeline, /onSelect/);
});

test('audited remote loaders always recover from rejection', () => {
  for (const file of [
    'src/screens/EditAssetScreen.tsx',
    'src/components/PriceChart.tsx',
    'src/components/AssetReturnsPanel.tsx',
    'src/components/AssetProventosHistory.tsx',
    'src/components/IbovespaComparison.tsx',
  ]) {
    const source = read(file);
    assert.match(source, /catch/);
    assert.match(source, /finally/);
  }
});

test('Planejar keeps all planning tools reachable', () => {
  const planning = read('src/screens/PlanningScreen.tsx');
  for (const route of ['Aporte', 'Goals', 'DividendTarget', 'IRAutomatico', 'Declaracao', 'Relatorios', 'Backtest']) assert.match(planning, new RegExp(route));
});

test('user-facing screens and components contain no legacy brand colors', () => {
  const contents = ['src/screens', 'src/components'].flatMap((folder) => fs.readdirSync(path.join(root, folder)).filter((name) => name.endsWith('.tsx')).map((name) => read(`${folder}/${name}`)));
  assert.doesNotMatch(contents.join('\n'), /#0B5345|#073B30|#C9A961/i);
});

test('entry flows use the redesigned visual language', () => {
  const onboarding = read('src/screens/OnboardingScreen.tsx');
  const auth = read('src/screens/AuthScreen.tsx');
  assert.match(onboarding, /Seu dinheiro, com mais clareza/);
  assert.doesNotMatch(onboarding, /emoji:/);
  assert.match(auth, /Organize hoje\. Decida melhor amanhã\./);
  assert.match(read('src/screens/PinScreen.tsx'), /maxWidth: 360/);
});

test('operation entry is unified and has a bounded saving state', () => {
  const operations = read('src/screens/OperacoesScreen.tsx');
  const modal = read('src/components/NewOperationModal.tsx');
  assert.match(operations, /useOperationModal/);
  assert.doesNotMatch(operations, /visible=\{addOpen\}/);
  assert.match(modal, /submitOperationWithDeadline/);
  assert.match(modal, /A venda excede sua posição atual/);
  assert.match(modal, /finally\s*\(\)\s*=>|finally\s*\{/);
});

test('Orbit changes screen structure instead of only swapping colors', () => {
  const shell = read('src/ui/editorial/EditorialScreen.tsx');
  const dashboard = read('src/screens/DashboardScreen.tsx');
  assert.match(shell, /orbitGlow|orbitRing/);
  assert.match(dashboard, /quickActions|Aportar agora|Registrar operação/);
});

test('asset entry is a focused form and analysis stays in asset detail', () => {
  const add = read('src/screens/AddAssetScreen.tsx');
  const detail = read('src/screens/AssetDetailScreen.tsx');
  assert.doesNotMatch(add, /<PriceChart|<AssetAnalysis/);
  assert.match(detail, /<PriceChart/);
  assert.match(detail, /<AssetAnalysis/);
  assert.match(detail, /<AssetNewsFeed/);
});

test('operation dates use the Brazilian input format', () => {
  const modal = read('src/components/NewOperationModal.tsx');
  assert.match(modal, /DD\/MM\/AAAA/);
  assert.match(modal, /brazilianDateToISO/);
  assert.doesNotMatch(modal, /placeholder="AAAA-MM-DD"/);
});

test('market data surfaces expose working recovery controls', () => {
  const chart = read('src/components/PriceChart.tsx');
  const news = read('src/components/AssetNewsFeed.tsx');
  assert.match(chart, /onLayout/);
  assert.match(chart, /Tentar de novo/);
  assert.match(news, /Tentar novamente/);
  assert.match(news, /force: retryNonce > 0/);
});
