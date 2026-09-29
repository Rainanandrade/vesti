const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { escapeHtml } = require('../src/utils/html');

test('escapes every HTML-significant character', () => {
  assert.equal(
    escapeHtml(`<script data-x="1" data-y='2'>&`),
    '&lt;script data-x=&quot;1&quot; data-y=&#39;2&#39;&gt;&amp;',
  );
});

test('report generation applies escaping and safe tab isolation', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../src/utils/reports.ts'), 'utf8');
  assert.match(source, /escapeHtml\(userName\)/);
  assert.match(source, /escapeHtml\(a\.name\)/);
  assert.match(source, /noopener noreferrer/);
  assert.match(source, /URL\.revokeObjectURL/);
});

test('handles non-string values without producing executable markup', () => {
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(42), '42');
});
