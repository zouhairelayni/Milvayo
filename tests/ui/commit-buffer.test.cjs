// /tests/ui/commit-buffer.test.cjs
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createCommitBuffer}=require('../../src/ui/commitBuffer.cjs');
const fake=()=>{let fn=null;return {set:f=>{fn=f;return 1},clear:()=>{fn=null},fire:()=>fn&&fn(),armed:()=>!!fn}};
test('only the newest value is committed once typing pauses',()=>{
 const t=fake(),got=[];const b=createCommitBuffer(v=>got.push(v),300,t);
 b.push('a');b.push('ab');b.push('abc');assert.deepEqual(got,[]);assert.equal(b.hasPending(),true);
 t.fire();assert.deepEqual(got,['abc']);assert.equal(b.hasPending(),false);
});
test('flush commits at once and a second flush does nothing',()=>{
 const t=fake(),got=[];const b=createCommitBuffer(v=>got.push(v),300,t);
 b.push('x');b.flush();b.flush();assert.deepEqual(got,['x']);assert.equal(t.armed(),false);
});
test('an empty string is a real value, not "nothing pending"',()=>{
 const t=fake(),got=[];const b=createCommitBuffer(v=>got.push(v),300,t);b.push('');b.flush();assert.deepEqual(got,['']);
});
test('store-writing text stays buffered; task title is durably staged, and Input flushes on blur, submit and unmount',async()=>{
 const read=f=>fs.readFileSync(path.join(__dirname,'../..',f),'utf8');
 const ui=read('src/ui/uiControls.js');
 assert.match(ui,/lazy\)\s*buffer\.current\.flush\(\);\s*onBlur/);assert.match(ui,/onSubmitEditing\(e\)/);assert.match(ui,/useEffect\(\(\) => \(\) => buffer\.current\.flush\(\), \[\]\)/);
 assert.match(read('src/screens/governance/Projects.js'),/<Input lazy value=\{info\.manager\}/);
 const sheet=read('src/screens/tasks/TaskSheet.js');
 assert.match(sheet,/<Input value=\{t\.title\}[^>]+onBlur=\{commitDraft\} onChangeText=\{v=>stage\(\{title:v\}\)\}/);
 const data=new Map(),commits=[],task={title:'Original'},storage={getItem:async key=>data.get(key),setItem:async(key,value)=>data.set(key,value)};
 const make=()=>require('../../src/screens/tasks/taskDraft.cjs').createTaskDraft({storage,key:'buffer-contract',getTask:()=>task,commit:patch=>{commits.push(patch);Object.assign(task,patch);return true;},persist:async()=>true});
 const draft=make();await draft.open();for(const title of ['N','Ne','New title'])await draft.stage({title});
 assert.deepEqual(commits,[],'typing must not run a domain/store mutation per keystroke');
 const reopened=make();await reopened.open();assert.equal(reopened.snapshot().patch.title,'New title','durable staging must survive editor/process replacement');
 await reopened.commit();assert.deepEqual(commits,[{title:'New title'}]);assert.deepEqual(reopened.snapshot().patch,{});
});

test('Releases: edit and create open a proper draft sheet instead of an inline fold',()=>{
 const read=f=>fs.readFileSync(path.join(__dirname,'../..',f),'utf8');
 const d=read('src/screens/delivery/Delivery.js');
 assert.match(d,/const edit=r=>\{reset\(r\);setFormOpen\(true\)\}/);
 assert.match(d,/onPress=\{\(\)=>edit\(r\)\}/);
 assert.match(d,/<Sheet visible=\{formOpen\}/);
 assert.match(d,/footer=\{<><Button label="Cancel"/);
 assert.match(d,/<Labeled title="Notes"[^>]+markdown/);
 assert.doesNotMatch(d,/<Fold title=\{editing\?/);
});
