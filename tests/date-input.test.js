const test = require('node:test');
const assert = require('node:assert/strict');

const { formatBrazilianDateInput, brazilianDateToISO, isoToBrazilianDate } = require('../src/utils/dateInput');

test('formats date input as DD/MM/YYYY', () => {
  assert.equal(formatBrazilianDateInput('03102026'), '03/10/2026');
  assert.equal(formatBrazilianDateInput('03/10/2026'), '03/10/2026');
});

test('converts valid Brazilian dates to the database format', () => {
  assert.equal(brazilianDateToISO('03/10/2026'), '2026-10-03');
  assert.equal(brazilianDateToISO('03/10/26'), '2026-10-03');
  assert.equal(brazilianDateToISO('31/02/2026'), null);
});

test('converts stored dates back to Brazilian display', () => {
  assert.equal(isoToBrazilianDate('2026-10-03'), '03/10/2026');
});
