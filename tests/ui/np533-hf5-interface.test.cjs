// /tests/ui/np533-hf5-interface.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..', '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const theme = require('../../src/ui/theme/theme.cjs');
test('RIVNA palette has all ten accent themes and accurate sample surfaces', () => {
  assert.equal(theme.ACCENTS.length,10);
  assert.equal(theme.findAccent('Aqua').darkPrimary,'#5B9CF8');
  assert.equal(theme.findAccent('Mint').lightBackground,'#EAF3EF');
  assert.equal(theme.palette('Lime','dark').bg,'#10120F');
  assert.equal(theme.palette('Lime','amoled').bg,'#000000');
  assert.equal(theme.palette('Orange','light').bg,'#F5F0EA');
  assert.equal(theme.palette('Orange','dark').accent,'#FF6F61');
  assert.equal(theme.palette('Orange','light').accent,'#E65A19');
  assert.equal(theme.palette('Amber','light').accent,'#FFA500');
  assert.equal(theme.palette('Violet','dark').surface,'#1B1C21');
});
test('appearance picker uses rounded square swatches in five-column mobile flow', () => {
  const s = read('src/screens/workspace/Workspace.js');
  assert.match(s,/label="AMOLED"/);
  assert.match(s,/width:'16%',flexGrow:1/);
  assert.match(s,/borderRadius:12/);
  assert.match(s,/option\.start/);assert.match(s,/option\.end/);
});
test('Board tools owns search, priority filter, advanced filters and options without nested switches', () => {
  const s=read('src/screens/board/Board.js');
  assert.match(s, /title="Tools"/);
  assert.match(s, /placeholder="Search board cards"/);
  assert.match(s, /High and above/);
  assert.match(s, /Descriptions on cards/);
  assert.match(s, /Clear filters/);
  assert.doesNotMatch(s, /<Pressable accessibilityRole="switch"[^>]*>[\s\S]*?<Switch/);
});
test('Timeline has one task ribbon, Show items/Hide items and two task sheets',()=>{
  const s=read('src/screens/timeline/Timeline.js');
  assert.match(s,/showItems \? 'Hide items' : 'Show items'/);
  for(const label of ['First task','Today','Critical path','Parent tasks','To schedule'])assert.ok(s.includes(label),label);
  assert.match(s, /<ScrollView horizontal showsHorizontalScrollIndicator=\{false\}/);
  assert.match(s, /taskPanel === 'parents' \? <Sheet visible/);
  assert.match(s, /taskPanel === 'schedule' \? <Sheet visible/);
  assert.doesNotMatch(s,/Needs scheduling/);
  assert.match(s,/np533DependencyColor\(l\)/);
});
test('shared buttons do not use decorative left or right accent bars',()=>{
  const s=read('src/ui/uiControls.js');
  assert.doesNotMatch(s,/borderLeftWidth|borderRightWidth|borderLeftColor|borderRightColor/);
});
