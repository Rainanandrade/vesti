const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('new brand tokens replace the legacy emerald and gold identity', () => {
  const tokens = read('src/theme/tokens.ts');
  assert.match(tokens, /canvas:\s*'#FBF8F3'/);
  assert.match(tokens, /brand:\s*'#5B4CF0'/);
  assert.match(tokens, /accent:\s*'#F07A6A'/);
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
