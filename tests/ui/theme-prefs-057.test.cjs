// /tests/ui/theme-prefs-057.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const {ACCENTS,palette} = require('../../src/ui/theme/themePalette.cjs');

test('The animated hamburger is retired with the phone side menu; nothing imports it', () => {
  assert.equal(fs.existsSync(path.join(root,'src/components/shell/MenuToggle.js')),false);
  for (const file of ['src/app/ModernApp.js','src/components/shell/Menus.js','src/components/shell/Bars.js']) assert.doesNotMatch(read(file),/MenuToggle/);
});
