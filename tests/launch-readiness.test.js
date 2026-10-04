const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('only Hoje hides the unwanted top glow and other areas keep Orbit identity', () => {
  const shell = read('src/ui/editorial/EditorialScreen.tsx');
  assert.match(shell, /orbitGlow/);
  assert.match(shell, /hideTopGlow/);
  assert.match(shell, /orbitRing/);
  assert.match(read('src/screens/DashboardScreen.tsx'), /<EditorialScreen[^>]*hideTopGlow/);
});

test('app offers system, light and dark appearance modes', () => {
  assert.match(read('app.json'), /"userInterfaceStyle":\s*"automatic"/);
  const settings = read('src/screens/SettingsScreen.tsx');
  assert.match(settings, /Aparência/);
  for (const label of ['Sistema', 'Claro', 'Escuro']) assert.match(settings, new RegExp(label));
  assert.match(read('App.tsx'), /ThemeProvider/);
  const tokens = read('src/theme/tokens.ts');
  assert.match(tokens, /onBrand:\s*'#FFFFFF'/);
  assert.match(tokens, /colorBackgroundFloating/);
});

test('home leads with patrimony and replaces the meaningless monthly blue status', () => {
  const dashboard = read('src/screens/DashboardScreen.tsx');
  assert.ok(dashboard.indexOf('<MetricBand') < dashboard.indexOf('<View style={styles.quickActions}'));
  const signals = read('src/features/today/TodaySignals.tsx');
  assert.doesNotMatch(signals, /No azul/);
  assert.match(signals, /Aportes no mês/);
});

test('dividend screen merges recorded income and has retryable bounded loading', () => {
  const screen = read('src/screens/ProventosScreen.tsx');
  assert.match(screen, /proventos/);
  assert.match(screen, /manualReceived/);
  assert.match(screen, /Tentar novamente/);
  assert.match(screen, /loadDividendInfo/);
  assert.doesNotMatch(screen, /item\.amount\.toFixed/);
  assert.match(screen, /manualKeys\.has\(eventKey\(item\)\)/);
});

test('operation history exposes edit and delete with position reconciliation', () => {
  const screen = read('src/screens/OperacoesScreen.tsx');
  const context = read('src/context/AppContext.tsx');
  assert.match(screen, /Editar movimento/);
  assert.match(screen, /Excluir movimento/);
  assert.match(context, /updateOperationAndPosition/);
  assert.match(context, /removeOperationAndUpdatePosition/);
  assert.match(context, /mutate_operation_and_rebuild_position/);
  assert.match(context, /rebuildPositionFromOperations/);
  assert.match(context, /restaura o ledger anterior/);
  assert.match(read('supabase/migrations/008_atomic_operation_mutations.sql'), /order by date asc, created_at asc, id asc/);
  assert.match(read('supabase/migrations/008_atomic_operation_mutations.sql'), /for update/);
});

test('contribution action always runs the intelligent analysis with a local fallback', () => {
  const aporte = read('src/screens/AporteScreen.tsx');
  const allocation = read('src/utils/allocation.ts');
  assert.match(aporte, /buildLocalAiSuggestion/);
  assert.match(aporte, /handleIntelligentSuggestion/);
  assert.match(aporte, /Análise personalizada/);
  assert.match(aporte, /recordOperationAndUpdatePosition/);
  assert.match(allocation, /getProfileTarget/);
  assert.match(allocation, /targetAllocation/);
  assert.match(allocation, /allocations\[c\]\s*=\s*\(value \* gaps\[c\]\) \/ totalGap/);
  assert.doesNotMatch(allocation, /gapPortion|targetPortion/);
  assert.match(aporte, /clientRequestId:\s*buyRequestId/);
  assert.match(aporte, /buyRequestLocked/);
});

test('portfolio AI surfaces keep a personalized local diagnostic fallback', () => {
  assert.match(read('src/screens/AIHubScreen.tsx'), /buildLocalDiagnostic/);
  assert.match(read('src/screens/IAConsultorScreen.tsx'), /buildLocalDiagnostic/);
  const diagnostic = read('src/utils/localDiagnostic.ts');
  assert.match(diagnostic, /getProfileTarget/);
  assert.match(diagnostic, /profile\.preference/);
});
