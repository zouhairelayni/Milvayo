// /tests/ui/release-0553-timeline-sprints-header.test.cjs
'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('Sprints binds Fold from the existing inline components module', () => {
  const delivery = read('src/screens/delivery/Delivery.js');
  const compact = read('src/components/inline/CompactTools.js');
  assert.match(delivery, /import \{[^}]*\bFold\b[^}]*\} from '\.\.\/\.\.\/components\/inline\/CompactTools'/);
  assert.match(compact, /export function Fold\(/);
  assert.match(delivery, /<Fold title=\{`Assigned tasks/);
  assert.match(delivery, /<Fold title=\{`Available backlog/);
  assert.match(delivery, /<Fold title=\{`Final sprint scope/);
});
