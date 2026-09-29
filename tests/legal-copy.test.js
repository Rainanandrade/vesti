const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.resolve(__dirname, '..', relativePath), 'utf8');
}

test('privacy copy does not claim the account password is stored on device', () => {
  const legal = read('src/data/legalDocs.ts');
  assert.doesNotMatch(legal, /PIN[^\n]*e a \*\*senha\*\*[^\n]*SecureStore/i);
  assert.match(legal, /Supabase Auth/);
});

test('2026 dividend copy describes current withholding and annual high-income rules', () => {
  const calculator = read('src/screens/IRCalculatorScreen.tsx');
  assert.doesNotMatch(calculator, /Dividendos de ações são isentos/i);
  assert.doesNotMatch(calculator, /existe PL[^\n]*2027/i);
  assert.match(calculator, /R\$ 50 mil/i);
  assert.match(calculator, /10%/);
  assert.match(calculator, /R\$ 600 mil/i);
  assert.match(calculator, /Lei 15\.270\/2025/);
});

test('sale copy never describes FII disposal gains as exempt', () => {
  const operations = read('src/screens/OperacoesScreen.tsx');
  assert.doesNotMatch(operations, /FII isento/i);
  assert.match(operations, /sem isenção na venda/i);
});

test('release guide documents external secrets without credential placeholders in eas.json', () => {
  const guide = read('APP_STORE.md');
  const eas = read('eas.json');
  assert.match(guide, /GROQ_API_KEY/);
  assert.match(guide, /SUPABASE_SERVICE_ROLE/);
  assert.match(guide, /PLUGGY_CLIENT_SECRET/);
  assert.doesNotMatch(eas, /PREENCHER_|seu@email\.com/);
});
