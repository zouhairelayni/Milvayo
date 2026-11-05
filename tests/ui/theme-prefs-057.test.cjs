// /tests/ui/theme-prefs-057.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const {ACCENTS,palette} = require('../../src/ui/theme/themePalette.cjs');

test('user-approved 10 palettes and deep AMOLED dimensions stay unchanged', () => {
  const expected = [
    ['Aqua','#5B9CF8','#2563EB','#5B9CF8','#2563EB'],
    ['Mint','#5FB8B1','#008080','#5FB8B1','#008080'],
    ['Lime','#D7F36A','#A3E635','#D7F36A','#4D7C0F'],
    ['Amber','#FBBF24','#FFA500','#FBBF24','#FFA500'],
    ['Orange','#FF6F61','#E65A19','#FF6F61','#E65A19'],
    ['Coral','#FB7185','#E11D48','#FB7185','#E11D48'],
    ['Pink','#F472B6','#DB2777','#F472B6','#DB2777'],
    ['Fuchsia','#E879F9','#C026D3','#E879F9','#C026D3'],
    ['Violet','#A78BFA','#7C3AED','#A78BFA','#7C3AED'],
    ['Indigo','#818CF8','#4F46E5','#818CF8','#4F46E5'],
  ];
  assert.deepEqual(ACCENTS.map(a=>[a.id,a.start,a.end,a.darkPrimary,a.lightPrimary]),expected);
  for (const accent of ACCENTS) {
    assert.equal(palette(accent.id,'light').accent,accent.lightPrimary);
    assert.equal(palette(accent.id,'amoled').bg,'#000000');
  }
  assert.match(read('src/ui/theme/themePalette.cjs'),/scale\(a.darkCard, 0\.50\)/);
  assert.match(read('src/ui/theme/themePalette.cjs'),/scale\(a.darkBackground, 0\.35\)/);
});

test('All accent-filled buttons use white labels and matching icons in every mode', () => {
  const ui=read('src/ui/uiControls.js');
  assert.match(ui,/const fg = primary \? '#FFFFFF'/);
  assert.match(ui,/<Feather name=\{icon\} size=\{13\} color=\{fg\}/);
  assert.match(read('src/components/shell/Bars.js'),/<Button label="New task" icon="plus" small /); // wide toolbar
  assert.match(read('src/components/shell/Bars.js'),/<Feather name="plus" size=\{22\} color="#FFFFFF" \/>/); // phone Create button
});

test('The animated hamburger is retired with the phone side menu; nothing imports it', () => {
  assert.equal(fs.existsSync(path.join(root,'src/components/shell/MenuToggle.js')),false);
  for (const file of ['src/app/ModernApp.js','src/components/shell/Menus.js','src/components/shell/Bars.js']) assert.doesNotMatch(read(file),/MenuToggle/);
});

test('Appearance row shows sun / moon plus the mode name, and the Milvayo wordmark mask is present', () => {
  const menu=read('src/components/shell/Menus.js'), more=read('src/screens/more/More.js');
  assert.match(more,/mode === 'light' \? 'sun' : 'moon'/);
  assert.match(more,/MODE_LABEL = \{ light: 'Light', dark: 'Dark', amoled: 'AMOLED' \}/);
  assert.match(menu,/milvayo-mask\.png/);
  for (const file of ['assets/milvayo-mask.png']) {
    assert.ok(fs.statSync(path.join(root,file)).size>250,file);
  }
  assert.equal(require('../../package.json').version,'0.5.59');
});
