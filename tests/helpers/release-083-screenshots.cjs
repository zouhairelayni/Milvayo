// /tests/helpers/release-083-screenshots.cjs
'use strict';
// Sequential headless screenshots only; no page interaction or browser automation.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const dir=path.resolve(__dirname,'../../docs/qa/release-083'),cases=[];
for(const name of ['workspace-390-dark','selected-390-dark','menu-inspect','menu-color','connector-style','drawing-dark','multi-selection','group-selected','group-arrange','menu-source','menu-objects','delete-connection','menu-tools','comment-dots','comment-bubble','menu-comments','menu-export','menu-settings','menu-view','linked-wbs-dark','tree-layout','selected-390-light'])cases.push([name,390,844]);
for(const [name,w,h] of [['selected-360-dark',360,800],['selected-430-dark',430,932],['source-844',844,390],['properties-844',844,390],['add-844-dark',844,390],['selected-1440-dark',1440,900],['source-1440',1440,900],['roadmap-desktop',1440,900]])cases.push([name,w,h]);
fs.mkdirSync(path.join(dir,'screenshots'),{recursive:true});
const results=[];
for(const [name,width,height] of cases){
 if(process.argv[2]&&!new RegExp(process.argv[2]).test(name))continue;
 const target=path.join(dir,'screenshots',name+'.png');if(fs.existsSync(target))fs.unlinkSync(target);
 const run=cp.spawnSync('chromium',['--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--hide-scrollbars','--screenshot='+target,`--window-size=${width},${height}`,'file://'+path.join(dir,'source-review',name+'.html')],{stdio:'ignore',timeout:30000});
 const bytes=fs.existsSync(target)?fs.readFileSync(target):null,valid=!!bytes&&bytes.toString('hex',0,8)==='89504e470d0a1a0a'&&bytes.readUInt32BE(16)===width&&bytes.readUInt32BE(20)===height;
 results.push({name,width,height,exitCode:run.status,error:run.error?.message||null,captured:valid});console.log(name,valid?'captured':'FAILED');
}
const previous=process.argv[2]?JSON.parse(fs.readFileSync(path.join(dir,'screenshots/coverage.json'))).cases:[],all=new Map(previous.map(item=>[item.name,item]));for(const item of results)all.set(item.name,item);
fs.writeFileSync(path.join(dir,'screenshots/coverage.json'),JSON.stringify({scope:'Actual JSX projected through a static RN Web fixture. Effects, measured viewport and modal placement adapted. Not live Canvas or native acceptance.',cases:[...all.values()]},null,2));
assert.ok(results.every(r=>r.captured&&r.exitCode===0),'Screenshot capture failed; see coverage.json');
console.log(`Captured ${results.length} screenshots; PNG dimensions verified`);
