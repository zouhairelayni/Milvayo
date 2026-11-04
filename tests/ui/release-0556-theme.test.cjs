// /tests/ui/release-0556-theme.test.cjs
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {ACCENTS,palette,contrast}=require('../../src/ui/theme/themePalette.cjs');
test('User chosen Daylight Amber, Orange, and dark accents stay exact',()=>{
  assert.equal(palette('Amber','light').accent,'#FFA500');
  assert.equal(palette('Orange','light').accent,'#E65A19');
  assert.equal(palette('Amber','dark').accent,'#FBBF24');
  assert.equal(palette('Orange','dark').accent,'#FF6F61');
  for(const a of ACCENTS)for(const mode of ['light','dark','amoled']){
    const p=palette(a.id,mode);
    assert.ok(contrast(p.accent,p.accentInk)>=4.5,`${a.id}/${mode} button ink`);
    for(const name of ['ink','muted','faint','accentText'])
      assert.ok(contrast(p[name],p.bg)>=4.5,`${a.id}/${mode} ${name}`);
  }
});
test('color picker reflects active Daylight shades instead of fixed old swatches',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../../src/screens/workspace/Workspace.js'),'utf8');
  assert.match(source,/c\.mode===\'light\'\?option\.lightPrimary:option\.end/);
});
