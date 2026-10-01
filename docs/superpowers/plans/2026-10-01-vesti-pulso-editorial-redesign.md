# Vesti Pulso Editorial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruir todas as interfaces alcançáveis do Vesti na direção Pulso editorial aprovada, preservando regras financeiras, segurança, dados e integrações.

**Architecture:** Uma camada editorial única fornece tokens, layout e componentes; modelos puros transformam dados existentes em manchetes, diagnósticos e listas. As telas continuam usando `AppContext`, Supabase e APIs atuais, mas deixam de definir identidade localmente. A migração é concluída por grupos funcionais e bloqueada por testes que enumeram todas as rotas.

**Tech Stack:** Expo SDK 54, React Native 0.81, React Navigation 7, TypeScript 5.9, Expo Haptics, React Native SVG, Node test runner.

---

## Mapa de arquivos

### Novos fundamentos

- `src/theme/editorial.ts`: cores, tipografia, espaçamento, divisores, navegação e breakpoints.
- `src/ui/editorial/EditorialScreen.tsx`: viewport mobile/desktop, safe area e scroll.
- `src/ui/editorial/EditorialHeader.tsx`: wordmark, contexto e ações.
- `src/ui/editorial/EditorialTitle.tsx`: kicker, título e apoio.
- `src/ui/editorial/MetricBand.tsx`: métricas financeiras sem card.
- `src/ui/editorial/UnderlineTabs.tsx`: abas locais.
- `src/ui/editorial/EditorialRow.tsx`: linha composicional.
- `src/ui/editorial/InsightNote.tsx`: explicação e acesso ao Vesti.
- `src/ui/editorial/ProgressLine.tsx`: progresso acessível.
- `src/ui/editorial/AllocationBand.tsx`: distribuição proporcional.
- `src/ui/editorial/EditorialForm.tsx`: campos, grupos e feedback.
- `src/ui/editorial/EditorialState.tsx`: loading, empty, error, locked, offline e read-only.
- `src/features/editorial/todayModel.ts`: manchete e movimento do Hoje.
- `src/features/editorial/investModel.ts`: alocação e concentração.
- `src/features/editorial/planningModel.ts`: meta principal, horizontes e aporte.
- `src/features/editorial/learnModel.ts`: recomendação educacional.

### Arquivos migrados

- `src/components/AdaptiveTabBar.tsx`, `Button.tsx`, `Card.tsx`, `Logo.tsx`.
- `src/navigation/RootNavigator.tsx`.
- Todos os arquivos registrados em `src/screens/`.

### Testes

- `tests/editorial-ui.test.js`: cobertura de rotas, identidade e ausência de padrões antigos.
- `tests/editorial-models.test.js`: regras puras de apresentação.
- Suíte existente em `tests/*.test.js`: regressão financeira e de segurança.

## Task 1: Travas de cobertura e sistema editorial

**Files:**
- Create: `tests/editorial-ui.test.js`
- Create: `src/theme/editorial.ts`
- Create: `src/ui/editorial/EditorialScreen.tsx`
- Create: `src/ui/editorial/EditorialHeader.tsx`
- Create: `src/ui/editorial/EditorialTitle.tsx`
- Create: `src/ui/editorial/MetricBand.tsx`
- Create: `src/ui/editorial/UnderlineTabs.tsx`
- Create: `src/ui/editorial/EditorialRow.tsx`
- Create: `src/ui/editorial/InsightNote.tsx`
- Create: `src/ui/editorial/ProgressLine.tsx`
- Create: `src/ui/editorial/AllocationBand.tsx`
- Create: `src/ui/editorial/EditorialForm.tsx`
- Create: `src/ui/editorial/EditorialState.tsx`
- Modify: `src/components/Button.tsx`
- Modify: `src/components/Card.tsx`
- Modify: `src/components/Logo.tsx`

- [ ] **Step 1: Escrever o teste de cobertura que falha**

```js
const registeredScreens = [
  'AIHubScreen','AddAssetScreen','AlertsScreen','AporteCalculatorScreen','AporteScreen',
  'AssetDetailScreen','AssetsListScreen','AuthScreen','BacktestScreen','CompareAssetsScreen',
  'DashboardScreen','DeclaracaoScreen','DividendTargetScreen','EditAssetScreen','GoalsScreen',
  'IAConsultorScreen','IRAutomaticoScreen','IRCalculatorScreen','LearnScreen','LegalDocScreen',
  'NewsScreen','OnboardingScreen','OperacoesScreen','PasswordRecoveryScreen','PinScreen',
  'PlanningScreen','PortfolioScreen','PreferenceScreen','ProSubscribeScreen','ProfileQuizScreen',
  'ProventosScreen','RankingsScreen','RelatoriosScreen','SettingsScreen','ShareWalletsScreen',
  'WatchlistScreen'
];

test('every reachable screen uses the editorial system', () => {
  for (const name of registeredScreens) {
    assert.match(read(`src/screens/${name}.tsx`), /ui\/editorial|Editorial/);
  }
});
```

- [ ] **Step 2: Executar e confirmar a falha pela lista ainda não migrada**

Run: `node --test tests/editorial-ui.test.js`  
Expected: FAIL em telas que ainda não importam o sistema editorial.

- [ ] **Step 3: Criar tokens editoriais únicos**

```ts
export const editorial = {
  color: {
    canvas: '#F5F0E8', ink: '#171827', muted: '#6C6674', line: '#D8D0C4',
    indigo: '#5B4CF0', indigoSoft: '#EEE9FF', coral: '#FF655B', coralSoft: '#FBE2DC',
    positive: '#28644F', positiveSoft: '#DEF0E7', inverse: '#201D31', white: '#FFFFFF',
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 },
  radius: { control: 10, soft: 14, feature: 20, navigation: 22, full: 999 },
  type: { kicker: 11, caption: 12, body: 15, title: 20, headline: 36, value: 31 },
  layout: { mobileGutter: 24, maxReadingWidth: 720, maxWorkspaceWidth: 1180, desktop: 900 },
  motion: { fast: 140, base: 220, slow: 360 },
} as const;
```

- [ ] **Step 4: Criar contratos dos componentes**

```ts
type EditorialTitleProps = { kicker: string; title: string; support?: string };
type MetricBandProps = { label: string; value: string; delta?: string; tone?: 'positive'|'neutral'|'attention'; hidden?: boolean; onToggleHidden?: () => void };
type EditorialRowProps = { leading?: ReactNode; title: string; detail?: string; value?: string; trend?: string; onPress?: () => void; disabled?: boolean };
type EditorialStateProps = { kind: 'loading'|'empty'|'error'|'locked'|'offline'|'readOnly'; title: string; detail: string; action?: { label: string; onPress: () => void } };
```

- [ ] **Step 5: Implementar feedback, acessibilidade e responsividade nos componentes**

`EditorialScreen` usa `useWindowDimensions`, `SafeAreaView` de `react-native-safe-area-context`, conteúdo limitado e `RefreshControl` opcional. Controles usam `Pressable`, `accessibilityRole`, `accessibilityState`, alvo mínimo de 44px e haptics existentes apenas em ações principais.

- [ ] **Step 6: Executar checks dos fundamentos**

Run: `npm run typecheck && node --test tests/ui-redesign.test.js tests/editorial-ui.test.js`  
Expected: TypeScript PASS; o teste de cobertura continua falhando apenas nas telas não migradas.

- [ ] **Step 7: Commit**

```bash
git add src/theme/editorial.ts src/ui/editorial src/components tests/editorial-ui.test.js
git commit -m "feat: build Vesti editorial design system"
```

## Task 2: Shell, navegação e Hoje

**Files:**
- Create: `src/features/editorial/todayModel.ts`
- Create: `tests/editorial-models.test.js`
- Modify: `src/components/AdaptiveTabBar.tsx`
- Modify: `src/navigation/RootNavigator.tsx`
- Rewrite: `src/screens/DashboardScreen.tsx`
- Modify: `src/features/today/TodayTimeline.tsx`
- Modify: `src/features/today/TodayNextSteps.tsx`

- [ ] **Step 1: Testar o modelo de manchete antes da implementação**

```js
test('today headline explains the strongest verified movement', () => {
  assert.equal(buildTodayNarrative({ profitPct: 4.8, cashFlow: 928, concentration: 18 }).headline, 'Seu patrimônio ganhou ritmo.');
  assert.equal(buildTodayNarrative({ profitPct: -3, cashFlow: -500, concentration: 31 }).tone, 'attention');
});
```

- [ ] **Step 2: Implementar modelo puro com fatos determinísticos**

```ts
export function buildTodayNarrative(input: TodayNarrativeInput): TodayNarrative {
  if (input.concentration >= 25) return { headline: 'Sua carteira pede equilíbrio.', tone: 'attention', reason: 'Um ativo ocupa uma parcela relevante do patrimônio.' };
  if (input.profitPct > 2 && input.cashFlow >= 0) return { headline: 'Seu patrimônio ganhou ritmo.', tone: 'positive', reason: 'Aportes e desempenho caminharam na mesma direção.' };
  return { headline: 'Seu mês está em construção.', tone: 'neutral', reason: 'A consistência dos próximos movimentos será mais importante que uma oscilação isolada.' };
}
```

- [ ] **Step 3: Reconstruir navegação mobile e rail desktop**

Manter exatamente Hoje, Investir, Planejar e Aprender. Mobile usa barra escura flutuante; desktop usa rail escuro compacto, wordmark no topo, seleção indigo/coral e as mesmas rotas.

- [ ] **Step 4: Reconstruir Hoje na ordem aprovada**

Usar `EditorialHeader`, `EditorialTitle`, `MetricBand`, gráfico livre, narrativa, timeline e próximos passos. Não envolver cada seção em `Surface` ou `Card`.

- [ ] **Step 5: Testar rotas e modelo**

Run: `node --test tests/editorial-models.test.js tests/today-timeline.test.js tests/editorial-ui.test.js && npm run typecheck`  
Expected: modelos e Hoje PASS; cobertura ainda lista grupos posteriores.

- [ ] **Step 6: Commit**

```bash
git add src/features/editorial src/features/today src/components/AdaptiveTabBar.tsx src/navigation/RootNavigator.tsx src/screens/DashboardScreen.tsx tests
git commit -m "feat: rebuild Vesti Today in editorial style"
```

## Task 3: Investir e fluxos de ativos

**Files:**
- Create: `src/features/editorial/investModel.ts`
- Rewrite: `src/screens/PortfolioScreen.tsx`
- Migrate: `src/screens/AddAssetScreen.tsx`
- Migrate: `src/screens/EditAssetScreen.tsx`
- Migrate: `src/screens/AssetDetailScreen.tsx`
- Migrate: `src/screens/AssetsListScreen.tsx`
- Migrate: `src/screens/CompareAssetsScreen.tsx`
- Migrate: `src/screens/WatchlistScreen.tsx`
- Migrate: `src/screens/OperacoesScreen.tsx`
- Migrate: `src/screens/ProventosScreen.tsx`
- Migrate: `src/screens/AporteCalculatorScreen.tsx`
- Modify: `tests/editorial-models.test.js`

- [ ] **Step 1: Testar alocação e concentração**

```js
test('investment presentation identifies concentration without changing portfolio math', () => {
  const view = buildInvestmentView([{ symbol:'WEGE3', current:28000, type:'acao' }, { symbol:'HGLG11', current:72000, type:'fii' }]);
  assert.equal(view.total, 100000);
  assert.equal(view.topHolding.symbol, 'HGLG11');
  assert.equal(view.topHolding.share, 72);
  assert.equal(view.needsAttention, true);
});
```

- [ ] **Step 2: Implementar modelo sem duplicar cálculos financeiros**

O modelo recebe valores já calculados por `computePortfolioStats`, agrupa por classe, calcula percentuais de apresentação e seleciona o maior peso. Não altera preço médio, lucro ou impostos.

- [ ] **Step 3: Reconstruir Investir conforme a proposta**

Adicionar abas sublinhadas, gráfico livre, faixa de alocação, diagnóstico e posições em `EditorialRow`. Busca, adicionar, comparar e watchlist ficam em ações do cabeçalho/contexto.

- [ ] **Step 4: Migrar formulários e detalhes**

`AddAsset`, `EditAsset` e operações usam `EditorialForm`; detalhe usa título editorial, métrica, histórico e fundamentos; listas e comparação usam linhas e divisores. Todas preservam handlers atuais.

- [ ] **Step 5: Verificar edição, erro e read-only**

Testar localmente: adicionar inválido mantém formulário; salvar mostra pending; falha preserva valores; carteira compartilhada desabilita mutações e explica o motivo.

- [ ] **Step 6: Executar testes**

Run: `npm test && npm run typecheck`  
Expected: PASS sem regressão financeira.

- [ ] **Step 7: Commit**

```bash
git add src/features/editorial/investModel.ts src/screens tests
git commit -m "feat: rebuild editorial investment experience"
```

## Task 4: Planejar e ferramentas financeiras

**Files:**
- Create: `src/features/editorial/planningModel.ts`
- Rewrite: `src/screens/PlanningScreen.tsx`
- Migrate: `src/screens/AporteScreen.tsx`
- Migrate: `src/screens/GoalsScreen.tsx`
- Migrate: `src/screens/DividendTargetScreen.tsx`
- Migrate: `src/screens/IRAutomaticoScreen.tsx`
- Migrate: `src/screens/IRCalculatorScreen.tsx`
- Migrate: `src/screens/DeclaracaoScreen.tsx`
- Migrate: `src/screens/RelatoriosScreen.tsx`
- Migrate: `src/screens/BacktestScreen.tsx`
- Modify: `tests/editorial-models.test.js`

- [ ] **Step 1: Testar ordenação de horizontes e meta principal**

```js
test('planning view selects active primary goal and sorts horizons', () => {
  const view = buildPlanningView([{ id:'b', targetDate:'2035-01-01', progress:31 }, { id:'a', targetDate:'2027-01-01', progress:84 }]);
  assert.equal(view.primary.id, 'a');
  assert.deepEqual(view.horizons.map((goal) => goal.id), ['a','b']);
});
```

- [ ] **Step 2: Reconstruir Planejar**

Meta principal, aporte sugerido dominante, horizontes cronológicos e ferramentas secundárias. Aporte sugerido reutiliza a lógica existente e exibe as premissas.

- [ ] **Step 3: Migrar metas, renda e aporte**

Formulários usam campos editoriais, progresso em linha e confirmação para mutações destrutivas. Estados vazios orientam uma única ação.

- [ ] **Step 4: Migrar ferramentas tributárias e simulações**

Preservar regras 2026 e disclaimers. Resultados usam `MetricBand` e linhas; não recriar dashboards de cartões.

- [ ] **Step 5: Executar regressões tributárias e tipos**

Run: `node --test tests/ir-engine.test.js tests/legal-copy.test.js tests/editorial-models.test.js && npm run typecheck`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/editorial/planningModel.ts src/screens tests/editorial-models.test.js
git commit -m "feat: rebuild editorial planning experience"
```

## Task 5: Aprender, conteúdo e assistente

**Files:**
- Create: `src/features/editorial/learnModel.ts`
- Rewrite: `src/screens/LearnScreen.tsx`
- Migrate: `src/screens/NewsScreen.tsx`
- Migrate: `src/screens/RankingsScreen.tsx`
- Migrate: `src/screens/AIHubScreen.tsx`
- Migrate: `src/screens/IAConsultorScreen.tsx`
- Migrate: `src/screens/AlertsScreen.tsx`
- Modify: `tests/editorial-models.test.js`

- [ ] **Step 1: Testar recomendação educacional explicável**

```js
test('learning recommendation exposes its reason', () => {
  const result = recommendLesson({ concentration: 28, completed: [] });
  assert.equal(result.slug, 'diversificacao');
  assert.match(result.reason, /concentra/i);
});
```

- [ ] **Step 2: Reconstruir Aprender**

Uma aula dominante, motivo da recomendação, trilhas em linhas, duas leituras editoriais e glossário integrado. Notícias e rankings permanecem acessíveis como apoio.

- [ ] **Step 3: Migrar assistente e alertas**

Assistente mantém validação e entitlement; UI recebe contexto explícito. Alertas usam linhas cronológicas e estados lido/não lido sem cards repetitivos.

- [ ] **Step 4: Testar bloqueio Pro e respostas**

Run: `node --test tests/ai-response.test.js tests/entitlement.test.js tests/editorial-models.test.js && npm run typecheck`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/editorial/learnModel.ts src/screens tests/editorial-models.test.js
git commit -m "feat: rebuild editorial learning experience"
```

## Task 6: Entrada, conta, ajustes e telas restantes

**Files:**
- Migrate: `src/screens/OnboardingScreen.tsx`
- Migrate: `src/screens/AuthScreen.tsx`
- Migrate: `src/screens/PasswordRecoveryScreen.tsx`
- Migrate: `src/screens/PinScreen.tsx`
- Migrate: `src/screens/ProfileQuizScreen.tsx`
- Migrate: `src/screens/PreferenceScreen.tsx`
- Migrate: `src/screens/SettingsScreen.tsx`
- Migrate: `src/screens/LegalDocScreen.tsx`
- Migrate: `src/screens/ShareWalletsScreen.tsx`
- Migrate: `src/screens/ProSubscribeScreen.tsx`

- [ ] **Step 1: Migrar a jornada de entrada**

Onboarding usa manchetes editoriais e ilustração geométrica; autenticação e recuperação usam formulário único; PIN mantém teclado compacto e lockout; quiz e preferência usam progresso e seleção clara.

- [ ] **Step 2: Migrar conta e segurança**

Ajustes usam seções tipográficas e `EditorialRow`; compartilhamento marca permissões; assinatura explica valor; exclusão de conta mantém confirmação e RPC segura.

- [ ] **Step 3: Completar a trava de cobertura**

Run: `node --test tests/editorial-ui.test.js`  
Expected: PASS para todas as telas enumeradas, sem exceções.

- [ ] **Step 4: Executar regressões de autenticação e segurança**

Run: `node --test tests/pin-lockout.test.js tests/database-hardening.test.js tests/legal-copy.test.js && npm run typecheck`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/screens tests/editorial-ui.test.js
git commit -m "feat: complete editorial supporting flows"
```

## Task 7: Auditoria, validação visual e entrega

**Files:**
- Modify: `tests/editorial-ui.test.js`
- Modify only when defects are found: migrated source files

- [ ] **Step 1: Auditar resíduos da interface antiga**

Run: `rg -n "#0B5345|#073B30|#C9A961|emoji:|styles\.card|<Card" src/screens src/components`  
Expected: nenhuma ocorrência visual alcançável; usos semânticos documentados são avaliados individualmente.

- [ ] **Step 2: Executar verificação completa**

Run: `npm run verify && git diff --check`  
Expected: 0 falhas.

- [ ] **Step 3: Gerar a aplicação web**

Run: `npx expo export --platform web`  
Expected: export concluído em `dist/` sem erro.

- [ ] **Step 4: Percorrer matriz visual**

Validar mobile 390×844 e desktop 1440×900: entrada, quatro destinos, um detalhe, um formulário, uma ferramenta, ajustes, Pro, empty, error e read-only. Registrar e corrigir overflow, ação inacessível, rota quebrada ou tela antiga.

- [ ] **Step 5: Testar os fluxos críticos**

Executar login, PIN incorreto/correto, privacidade, navegação das quatro áreas, criação/edição em dados de teste, falha e retry. Não alterar dados reais durante QA visual.

- [ ] **Step 6: Commit final e push**

```bash
git add src tests package.json package-lock.json docs
git commit -m "feat: deliver complete Vesti editorial redesign"
git push origin codex/production-hardening
```

- [ ] **Step 7: Publicar somente após confirmação final**

Confirmar que o deployment de preview corresponde ao commit final, abrir a prévia e verificar as quatro áreas. Só então promover ao domínio `vesti-nine.vercel.app`.
