// /tests/ui/np533-hf5-interface.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const theme = require('../../src/ui/theme/theme.cjs');

test('shared buttons do not use decorative left or right accent bars',()=>{
  const s=read('src/ui/uiControls.js');
  assert.doesNotMatch(s,/borderLeftWidth|borderRightWidth|borderLeftColor|borderRightColor/);
});
