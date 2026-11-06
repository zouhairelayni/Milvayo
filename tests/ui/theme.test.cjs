// /tests/ui/theme.test.cjs
'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const theme=require('../../src/ui/theme/theme.cjs');
test('RIVNA-inspired accent selector exposes ten unique named choices',()=>{
 assert.deepEqual(theme.ACCENTS.map(c=>c.id),['Aqua','Mint','Lime','Amber','Orange','Coral','Pink','Fuchsia','Violet','Indigo']);
 assert.equal(new Set(theme.ACCENTS.map(c=>c.hex)).size,10);
});
test('Coral is default and invalid names use safe fallback',()=>{
 assert.equal(theme.DEFAULT_ACCENT,'Coral');assert.equal(theme.findAccent('Orange').hex,'#FCA311');
 assert.equal(theme.findAccent('not-a-theme').id,'Coral');
});
test('accent tokens preserve semantic palette values and do not mutate workspace data',()=>{
 const model=require('../../src/domain/model.cjs'),p=model.makeProject({name:'Stable'});const before=JSON.stringify(p);
 const original=theme.palette('Coral','dark');
 for(const accent of theme.ACCENTS){
  const tokens=theme.themeTokens(accent.id), next=theme.palette(accent.id,'dark');
  assert.equal(tokens.id,accent.id);assert.equal(tokens.accent,accent.hex);
  for(const key of ['success','danger','warning','info'])assert.equal(next[key],original[key]);
  assert.equal(JSON.stringify(p),before);
 }
});
