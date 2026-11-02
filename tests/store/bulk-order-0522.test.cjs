// /tests/store/bulk-order-0522.test.cjs
'use strict';
// Bulk "Done" must not depend on the order tasks were selected in.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const src = fs.readFileSync(require('node:path').join(__dirname, '../../src/store/store.js'), 'utf8');
test('bulkStatus orders selected tasks predecessors first', () => {
  const m = src.match(/const orderByDependency=[\s\S]*?return out\};/);
  assert.ok(m, 'helper present');
  const orderByDependency = new Function(`${m[0]}; return orderByDependency;`)();
  const p = { tasks: [{ id: 'A', dependsOn: [] }, { id: 'B', dependsOn: ['A'] }, { id: 'C', dependsOn: ['B'] }] };
  assert.deepEqual(orderByDependency(p, ['C', 'B', 'A']), ['A', 'B', 'C']);
  assert.deepEqual(orderByDependency(p, ['B', 'A']), ['A', 'B']);
  assert.deepEqual(orderByDependency(p, ['C']), ['C']); // unselected predecessors are not added
  assert.match(src, /bulkStatus:\(ids,status\)=>projectChange\(p=>orderByDependency\(p,ids\)/);
});
