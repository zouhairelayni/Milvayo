'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const theme=require('../src/theme.cjs');const design=require('../src/design.cjs');
test('RIVNA-inspired accent selector exposes ten unique named choices',()=>{
 assert.deepEqual(theme.ACCENTS.map(c=>c.id),['Aqua','Mint','Lime','Amber','Orange','Coral','Pink','Fuchsia','Violet','Indigo']);
 assert.equal(new Set(theme.ACCENTS.map(c=>c.hex)).size,10);
});
test('Claude clay orange is default and invalid names use safe fallback',()=>{
 assert.equal(theme.DEFAULT_ACCENT,'Orange');assert.equal(theme.findAccent('Orange').hex,'#D97757');
 assert.equal(theme.findAccent('not-a-theme').id,'Orange');
});
test('changing accent recomputes foreground, border, and selection surface without changing semantic colors',()=>{
 const semantic={green:design.colors.green,red:design.colors.red,amber:design.colors.amber};
 assert.equal(design.setAccent('Aqua'),'Aqua');assert.equal(design.colors.purple,'#2DD4BF');
 assert.equal(design.colors.accent,'#2DD4BF');assert.match(design.colors.purpleDim,/rgba\(45,212,191,0.16\)/);
 assert.deepEqual({green:design.colors.green,red:design.colors.red,amber:design.colors.amber},semantic);
 design.setAccent('Orange');assert.equal(design.colors.purple,'#D97757');
});
test('theme selection never changes project data or imports',()=>{
 const model=require('../src/model.cjs'),p=model.makeProject({name:'Stable'});const before=JSON.stringify(p);
 design.setAccent('Fuchsia');assert.equal(JSON.stringify(p),before);design.setAccent('Orange');
});
