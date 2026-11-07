// /tests/helpers/canvas-headless-screenshots.cjs
'use strict';
// Sequential screenshot capture only. No page interaction, Playwright, native builds or graphical browser.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'../../docs/qa/release-081'),cases=[];
for(const [w,h] of [[360,800],[390,844],[844,390],[1440,900]])for(const kind of ['workspace','selected','add'])cases.push([`${kind}-${w}-dark`,w,h]);
for(const name of ['editor-light','selected-390-light','add-390-light','menu-drawing','menu-source','menu-tools','inline-note'])cases.push([name,390,844]);cases.push(['selected-large-font',360,800]);
const results=[];
for(const [name,width,height] of cases){
 const target=path.join(dir,'screenshots',name+'.png');if(fs.existsSync(target))fs.unlinkSync(target);
 const run=cp.spawnSync('chromium',['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--hide-scrollbars','--screenshot='+target,`--window-size=${width},${height}`,'file://'+path.join(dir,'source-review',name+'.html')],{stdio:'ignore',timeout:30000});
 const bytes=fs.existsSync(target)?fs.readFileSync(target):null,valid=!!bytes&&bytes.toString('hex',0,8)==='89504e470d0a1a0a'&&bytes.readUInt32BE(16)===width&&bytes.readUInt32BE(20)===height;
 results.push({name,width,height,exitCode:run.status,error:run.error?.message||null,captured:valid});
}
fs.writeFileSync(path.join(dir,'screenshots/coverage.json'),JSON.stringify({scope:'Headless Chromium screenshots of actual-JSX static RN Web projections. Effects, viewport measurements and modal placement adapted by the fixture harness. Not native or live Canvas acceptance.',cases:results},null,2));
assert.ok(results.every(r=>r.captured&&r.exitCode===0),'One or more screenshots failed; see coverage.json');console.log(`Captured ${results.length} screenshots sequentially; all PNG dimensions verified`);
