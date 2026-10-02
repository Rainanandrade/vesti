const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const registeredScreens = [
  'AIHubScreen', 'AddAssetScreen', 'AlertsScreen', 'AporteCalculatorScreen', 'AporteScreen',
  'AssetDetailScreen', 'AssetsListScreen', 'AuthScreen', 'BacktestScreen', 'CompareAssetsScreen',
  'DashboardScreen', 'DeclaracaoScreen', 'DividendTargetScreen', 'EditAssetScreen', 'GoalsScreen',
  'IAConsultorScreen', 'IRAutomaticoScreen', 'IRCalculatorScreen', 'LearnScreen', 'LegalDocScreen',
  'NewsScreen', 'OnboardingScreen', 'OperacoesScreen', 'PasswordRecoveryScreen', 'PinScreen',
  'PlanningScreen', 'PortfolioScreen', 'PreferenceScreen', 'ProSubscribeScreen', 'ProfileQuizScreen',
  'ProventosScreen', 'RankingsScreen', 'RelatoriosScreen', 'SettingsScreen', 'ShareWalletsScreen',
  'WatchlistScreen',
];

test('editorial design system exposes the approved primitives', () => {
  const files = [
    'src/theme/editorial.ts',
    'src/ui/editorial/EditorialScreen.tsx',
    'src/ui/editorial/EditorialHeader.tsx',
    'src/ui/editorial/EditorialTitle.tsx',
    'src/ui/editorial/MetricBand.tsx',
    'src/ui/editorial/UnderlineTabs.tsx',
    'src/ui/editorial/EditorialRow.tsx',
    'src/ui/editorial/InsightNote.tsx',
    'src/ui/editorial/ProgressLine.tsx',
    'src/ui/editorial/AllocationBand.tsx',
    'src/ui/editorial/EditorialForm.tsx',
    'src/ui/editorial/EditorialState.tsx',
  ];
  for (const file of files) assert.equal(fs.existsSync(path.join(root, file)), true, `${file} is missing`);
});

test('every reachable screen uses the editorial system', () => {
  for (const name of registeredScreens) {
    assert.match(read(`src/screens/${name}.tsx`), /ui\/editorial|Editorial/,
      `${name} has not migrated to the editorial system`);
  }
});

test('editorial palette contains no legacy brand colors', () => {
  const theme = read('src/theme/editorial.ts');
  const tokens = read('src/theme/tokens.ts');
  assert.match(theme, /canvas:\s*palette\.canvas/);
  assert.match(theme, /indigo:\s*palette\.brand/);
  assert.match(theme, /coral:\s*palette\.accent/);
  assert.match(tokens, /canvas:\s*'#11131B'/);
  assert.match(tokens, /brand:\s*'#7C5CFF'/);
  assert.match(tokens, /accent:\s*'#FF786B'/);
  assert.doesNotMatch(theme, /#0B5345|#073B30|#C9A961/i);
});
