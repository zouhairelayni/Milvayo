// /tests/ui/theme.test.cjs
'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const theme=require('../../src/ui/theme/theme.cjs');const design=require('../../src/ui/theme/design.cjs');
test('RIVNA-inspired accent selector exposes ten unique named choices',()=>{
 assert.deepEqual(theme.ACCENTS.map(c=>c.id),['Aqua','Mint','Lime','Amber','Orange','Coral','Pink','Fuchsia','Violet','Indigo']);
 assert.equal(new Set(theme.ACCENTS.map(c=>c.hex)).size,10);
});
test('Coral is default and invalid names use safe fallback',()=>{
 assert.equal(theme.DEFAULT_ACCENT,'Coral');assert.equal(theme.findAccent('Orange').hex,'#FF6F61');
 assert.equal(theme.findAccent('not-a-theme').id,'Coral');
});
test('changing accent recomputes foreground, border, and selection surface without changing semantic colors',()=>{
 const semantic={green:design.colors.green,red:design.colors.red,amber:design.colors.amber};
 assert.equal(design.setAccent('Aqua'),'Aqua');assert.equal(design.colors.purple,'#5B9CF8');
 assert.equal(design.colors.accent,'#5B9CF8');assert.match(design.colors.purpleDim,/rgba\(91,156,248,0.16\)/);
 assert.deepEqual({green:design.colors.green,red:design.colors.red,amber:design.colors.amber},semantic);
 design.setAccent('Orange');assert.equal(design.colors.purple,'#FF6F61');
});
test('theme selection never changes project data or imports',()=>{
 const model=require('../../src/domain/model.cjs'),p=model.makeProject({name:'Stable'});const before=JSON.stringify(p);
 design.setAccent('Fuchsia');assert.equal(JSON.stringify(p),before);design.setAccent('Orange');
});
