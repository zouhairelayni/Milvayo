// /tests/ui/release-058-motion.test.cjs
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const data=require('../../src/components/brand/morphGeometry.cjs');
const {DURATION,ribbonPath,outlinePath,windowProgress,easeInOut}=require('../../src/components/brand/morphMotion.cjs');

test('official geometry is a three-piece N and six 3-2-1 board openings in all ten colorways',()=>{
 assert.equal(data.routes.length,3);
 assert.deepEqual(data.windows.map(w=>w.length),[3,2,1]);
 assert.equal(Object.keys(data.palettes).length,10);
 for(const route of data.routes){assert.equal(route.from.length,72);assert.equal(route.to.length,72);}
 for(const [i,r] of data.routes.entries()){
   const first = ribbonPath(i,0);
   assert.ok(first.startsWith('M') && !first.includes(' H '));
   assert.equal(outlinePath(i,1),data.outlines[i]);
   assert.equal(ribbonPath(i,1),data.outlines[i]+' '+data.windows[i].join(' '));
 }
});

test('three ribbons move with the approved engineer timing and windows reveal in sequence',()=>{
 assert.equal(DURATION,3700);
 assert.equal(easeInOut(0),0);assert.equal(easeInOut(1),1);
 assert.ok(easeInOut(.5) > .2 && easeInOut(.5) < .8);
 assert.equal(windowProgress(0,.80),0);
 assert.equal(windowProgress(0,.82)>0,true);
 assert.equal(windowProgress(1,.82),0);
 assert.equal(windowProgress(5,.99),1);
 assert.equal(ribbonPath(0,.8),outlinePath(0,.8));
 assert.ok(ribbonPath(0,.85).length>outlinePath(0,.85).length);
});

test('the startup screen is logo-only, 1x, before workspace mount, and respects saved palette',()=>{
 const app=read('src/app/ModernApp.js');
 const theme=read('src/ui/theme/theme.js');
 const brand=read('src/components/brand/BoardMorph.js');
 assert.match(app,/function ColdStartGate/);
 assert.match(app,/restored \? <BoardMorph size=\{200\} active speed=\{1\} onFinish=\{finish\}/);
 assert.match(app,/if \(complete\) return <StoreProvider><Shell \/><\/StoreProvider>/);
 assert.match(app,/<StatusBar hidden \/>/);
 assert.match(theme,/setRestored\(true\)/);
 assert.match(theme,/setTimeout\(\(\)=>\{if\(active\)setRestored\(true\);\},1500\)/);
 assert.match(brand,/data\.palettes\[accentPref\]/);
 assert.match(brand,/isReduceMotionEnabled/);
 assert.match(brand,/cancelAnimationFrame/);
 assert.doesNotMatch(brand,/WebView|<Mask|opacity=\{progress\}/);
});

test('mobile drawer plays the logo at 1.5x every open and appearance toggle sits alongside menu',()=>{
 const menu=read('src/components/shell/Menus.js');
 const mobile=menu.slice(menu.indexOf('export function SideMenu('));
 const header=mobile.slice(mobile.indexOf('<View style={{ flexDirection:'),mobile.indexOf('<View style={{ marginBottom: 16 }}><Brand'));
 assert.match(menu,/speed=\{1\.5\} active=\{animated && active\}/);
 assert.match(mobile,/<Brand narrow animated active=\{visible\} \/>/);
 assert.match(header,/<MenuToggle open=\{visible\}/);
 assert.match(header,/Cycle light, dark and AMOLED appearance/);
 assert.equal((mobile.match(/<MenuToggle /g)||[]).length,1);
 assert.ok(header.indexOf('MenuToggle')<header.indexOf('Cycle light'));
});

test('0.5.58 manifests match and no legacy logo dependency is necessary',()=>{
 const pkg=require('../../package.json'),lock=require('../../package-lock.json'),app=require('../../app.json');
 assert.equal(pkg.version,'0.5.59');assert.equal(lock.version,pkg.version);assert.equal(lock.packages[''].version,pkg.version);assert.equal(app.expo.version,pkg.version);
 assert.match(read('src/components/shell/Menus.js'),/BoardMorph/);
 assert.doesNotMatch(read('src/components/shell/Menus.js'),/niyarvo-mark-mask\.png/);
});
