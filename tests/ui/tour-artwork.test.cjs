// /tests/ui/tour-artwork.test.cjs
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = (f) => fs.readFileSync(path.join(__dirname, '../..', f), 'utf8');
const art = read('src/components/illustrations/TourArtwork.js');
const kinds = [...art.match(/TOUR_KINDS = \[([^\]]+)\]/)[1].matchAll(/'(\w+)'/g)].map((m) => m[1]);

test('every tour drawing exists, uses only theme colours and is decorative', () => {
  assert.deepEqual(kinds, ['board', 'timeline', 'release', 'sprint', 'blank']);
  for (const k of kinds) assert.match(art, new RegExp(`\\n    ${k}: <>`), `${k} is drawn`);
  assert.doesNotMatch(art, /#[0-9a-fA-F]{3,8}\b/, 'colours come from the theme');
  assert.match(art, /pointerEvents: 'none'/);
  assert.ok(art.includes('ui/Reveal') && art.includes('<Reveal '), 'uses the app Reveal, not a second motion helper');
  assert.ok(art.includes('react-native-svg'));
});

test('the drawings share the EmptyArtwork language: selection disc, surface panels, hairlines', () => {
  const empty = read('src/components/illustrations/EmptyArtwork.js');
  for (const token of ['c.selection', 'c.surface', 'c.line', 'c.accent', 'c.success']) { assert.ok(art.includes(token), token); assert.ok(empty.includes(token), token); }
  assert.match(art, /viewBox="0 0 180 130"/);
  assert.match(empty, /viewBox="0 0 180 130"/);
});
