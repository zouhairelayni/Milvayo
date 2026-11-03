// /tests/domain/local-day.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { localDay } = require('../../src/utils/localDay.cjs');

test('localDay returns the device-local date, not the UTC date', () => {
  const old = process.env.TZ;
  try {
    process.env.TZ = 'Pacific/Auckland'; // UTC+13 in November
    assert.equal(localDay(new Date('2026-11-01T19:00:00Z')), '2026-11-02');
    process.env.TZ = 'America/Los_Angeles'; // UTC-7/-8
    assert.equal(localDay(new Date('2026-11-02T03:00:00Z')), '2026-11-01');
  } finally {
    if (old === undefined) delete process.env.TZ; else process.env.TZ = old;
  }
});

test('no "today" default is taken from the UTC clock any more', () => {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  const bad = walk(path.join(__dirname, '..', '..', 'src'))
    .filter((f) => /\.(js|cjs)$/.test(f))
    .filter((f) => /new Date\(\)\.toISOString\(\)\.slice\(0, ?10\)/.test(fs.readFileSync(f, 'utf8')));
  assert.deepEqual(bad, []);
});
