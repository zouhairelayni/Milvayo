
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '../src/screens/Timeline.js'), 'utf8');

test('native timeline never toggles native scroll ownership during long-press drag', () => {
  const matches = src.match(/scrollEnabled=\{Platform\.OS === 'web' \? !active : true\}/g) || [];
  assert.equal(matches.length, 2, 'outer + horizontal ScrollViews remain enabled on Android/iOS');
  assert.doesNotMatch(src, /scrollEnabled=\{!active\}/);
});

test('active bar is retained through horizontal window rebase', () => {
  assert.match(src, /if \(\(drag && drag\.id === t\.id\) \|\| \(link && link\.from === t\.id\)\) return true/);
  assert.match(src, /L\.onPreview\(L\.t\.id, L\.start, L\.due\)/);
});

test('background touch target only mounts for a visible dependency path', () => {
  assert.match(src, /paintWidth > 0 && paintH > 0 && links\.length > 0 \? <Pressable/);
});

test('horizontal dependency visibility considers routed polyline, not only endpoints', () => {
  assert.match(src, /const xs = pts\.map/);
  assert.match(src, /Math\.min\(\.\.\.xs\), Math\.max\(\.\.\.xs\)/);
});
