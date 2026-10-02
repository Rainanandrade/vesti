const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('editorial brand tokens replace the legacy emerald and gold identity', () => {
  const tokens = read('src/theme/tokens.ts');
  assert.match(tokens, /canvas:\s*'#F5F0E8'/);
  assert.match(tokens, /brand:\s*'#5B4CF0'/);
  assert.match(tokens, /accent:\s*'#FF655B'/);
  assert.doesNotMatch(tokens, /#0B5345|#C9A961/i);
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
