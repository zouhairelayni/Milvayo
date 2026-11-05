// /tests/ui/theme-launcher-icons-060.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'../..');
const { ACCENTS,MODES,iconChoice } = require('../../src/ui/theme/iconName.cjs');
const app = require('../../app.json').expo;
const png=p=>fs.readFileSync(path.join(root,p));
function dimensions(p) {const b=png(p);assert.equal(b.toString('ascii',1,4),'PNG');return [b.readUInt32BE(16),b.readUInt32BE(20)];}
test('30 deterministic icon choices follow all ten accents and resolved appearance',()=>{
 assert.equal(ACCENTS.length,10);assert.deepEqual(MODES,['light','dark','amoled']);
 for(const c of ACCENTS)for(const m of MODES){
  const i=iconChoice(c,m);assert.equal(i.slug,`${c.toLowerCase()}-${m}`);
  assert.equal(i.nativeName,c==='Coral'&&m==='dark'?null:`${c}${m[0].toUpperCase()}${m.slice(1)}`);
  assert.ok(i.manifest.includes(i.slug));assert.ok(i.favicon.includes(i.slug));
 }
 assert.equal(iconChoice('invalid','invalid').nativeName,null);
});
test('native prebuild has all 29 aliases plus primary and real themed assets',()=>{
 const cfg=app.plugins.find(p=>Array.isArray(p)&&p[0]==='expo-alternate-app-icons');
 assert.ok(cfg,'must include native alternate-icons plugin');assert.equal(cfg[1].length,29);
 const names=new Set();
 for(const entry of cfg[1]){
  assert.ok(!names.has(entry.name));names.add(entry.name);
  assert.deepEqual(dimensions(entry.ios.slice(2)),[1024,1024]);
  assert.deepEqual(dimensions(entry.android.foregroundImage.slice(2)),[1024,1024]);
  assert.match(entry.android.backgroundColor,/^#[0-9A-Fa-f]{6}$/);
 }
 assert.equal(app.icon,'./assets/icon.png');
 assert.deepEqual(dimensions('assets/icon.png'),[1024,1024]);
});
test('every PWA install manifest uses its matching theme artwork and stable app ID',()=>{
 const base=require('../../public/manifest.json');
 for(const c of ACCENTS)for(const m of MODES){
  const id=`${c.toLowerCase()}-${m}`;
  const man=JSON.parse(fs.readFileSync(path.join(root,'public/manifests',id+'.json')));
  assert.equal(man.id,'/');assert.equal(man.start_url,'/');assert.equal(man.icons.length,3);
  assert.deepEqual(man.icons.map(x=>x.purpose),['any','any','maskable']);
  for(const suffix of ['64','180','192','512','maskable-512']){
   const p=`public/icons/theme/${id}-${suffix}.png`;
   assert.deepEqual(dimensions(p),[Number(suffix.includes('maskable')?'512':suffix),Number(suffix.includes('maskable')?'512':suffix)]);
  }
 }
 assert.equal(base.id,'/');
});
test('theme provider controls icon across platform and the settings preview matches selected preferences',()=>{
 const theme=fs.readFileSync(path.join(root,'src/ui/theme/theme.js'),'utf8');
 const web=fs.readFileSync(path.join(root,'src/ui/theme/launcherIcon.web.js'),'utf8');
 const native=fs.readFileSync(path.join(root,'src/ui/theme/launcherIcon.native.js'),'utf8');
 const settings=fs.readFileSync(path.join(root,'src/screens/workspace/Workspace.js'),'utf8');
 assert.match(theme,/syncLauncherIcon\(accentPref, mode\)/);
 assert.match(theme,/\[accentPref, mode, restored\]/);
 assert.match(web,/getLink\('manifest'\)/);assert.match(web,/getLink\('apple-touch-icon'\)/);
 assert.match(native,/setAlternateAppIcon\(desired\)/);assert.match(native,/getAppIconName\(\)/);
 assert.match(settings,/iconPreview\(accentPref, mode\)/);
 assert.match(settings,/Follows theme/);
});
