const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

test('release versions are aligned and generated files are excluded', () => {
  const pkg = readJson('package.json');
  const app = readJson('app.json');
  const tsconfig = readJson('tsconfig.json');
  const eas = readJson('eas.json');

  assert.equal(pkg.version, app.expo.version);
  assert.match((tsconfig.exclude || []).join(' '), /dist/);
  assert.doesNotMatch(JSON.stringify(eas), /PREENCHER_/);
});

test('verification scripts are available', () => {
  const scripts = readJson('package.json').scripts || {};

  for (const name of ['test', 'typecheck', 'check:js', 'expo:check', 'verify']) {
    assert.equal(typeof scripts[name], 'string', `missing npm script: ${name}`);
  }
});

test('rate limiting supports the Redis variable names already configured on Vercel', () => {
  const rateLimit = fs.readFileSync(path.join(root, 'api/_lib/rateLimit.js'), 'utf8');

  assert.match(rateLimit, /KV_REST_API_URL/);
  assert.match(rateLimit, /KV_REST_API_TOKEN/);
});
