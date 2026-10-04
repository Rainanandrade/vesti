const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('Planejar exposes the future calculator and emergency reserve as simulations', () => {
  const planning = read('src/screens/PlanningScreen.tsx');
  const navigator = read('src/navigation/RootNavigator.tsx');

  assert.match(planning, /Simulações/);
  assert.match(planning, /Calculadora de futuro/);
  assert.match(planning, /Reserva de emergência/);
  assert.match(planning, /FutureCalculator/);
  assert.match(planning, /EmergencyReserve/);
  assert.doesNotMatch(planning, /navigation\.navigate\('AIHub'/);

  assert.match(navigator, /name="FutureCalculator"/);
  assert.match(navigator, /name="EmergencyReserve"/);
  assert.match(navigator, /EmergencyReserveScreen/);
});

test('planning tools return to Planejar and keep educational disclaimers', () => {
  const calculator = read('src/screens/AporteCalculatorScreen.tsx');
  const reserve = read('src/screens/EmergencyReserveScreen.tsx');
  const navigation = read('src/utils/navigation.ts');

  assert.match(calculator, /safeBackToPlanejar/);
  assert.match(calculator, /não garante rentabilidade futura/i);
  assert.doesNotMatch(calculator, /Tesouro Selic:|Ibovespa histórico:|Carteira diversificada de FIIs:/);
  assert.match(reserve, /safeBackToPlanejar/);
  assert.match(reserve, /não recomenda produtos financeiros/i);
  assert.match(navigation, /safeBackToPlanejar/);
});
