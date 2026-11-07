// /tests/domain/canvas.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const c=require('../../src/domain/canvas.cjs'),model=require('../../src/domain/model.cjs');
const now='2026-11-07T04:00:00.000Z';
const board=()=>c.createBoard({id:'canvas-a',projectId:'p',title:'Strategy',now});
const note=(id='n')=>c.createObject({id,boardId:'canvas-a',type:'note',text:'Release plan',now});
test('Canvas schema rejects future/corrupt/shared/cross-project/duplicate/oversize data without mutating the input',()=>{
 const b=board(),before=JSON.stringify(b);assert.equal(c.normalizeBoard(b,'p').title,'Strategy');
 for(const patch of [{schemaVersion:2},{projectId:'q'},{ownerId:'remote'},{grants:[{userId:'user',role:'editor'}]},{objects:[{...note(),x:Infinity}]},{objects:[note(),note()]},{objects:[{...note(),text:'x'.repeat(12001)}]}])assert.throws(()=>c.normalizeBoard({...b,...patch},'p'));
 assert.equal(JSON.stringify(b),before);assert.throws(()=>c.changeBoard(b,{type:'rename',title:'Renamed'},now,'viewer'));
});
test('Canvas operations keep links attached, move grouped objects, prevent locked edits and preserve canonical project data',()=>{
 let b=board();b=c.changeBoard(b,{type:'add',objects:[{...note('f'),type:'frame',width:600,height:400},{...note('a'),groupId:'f'},note('b')]},now);
 b=c.changeBoard(b,{type:'connect',edge:{id:'edge',from:'a',to:'b',label:'depends on'}},now);
 b=c.changeBoard(b,{type:'move',ids:['f'],dx:32,dy:16},now);assert.equal(b.objects.find(o=>o.id==='a').x,32);
 b=c.changeBoard(b,{type:'lock',id:'a',locked:true},now);assert.throws(()=>c.changeBoard(b,{type:'move',ids:['f'],dx:1,dy:0},now));
 assert.throws(()=>c.changeBoard(b,{type:'patch',id:'a',patch:{text:'lost'}},now));
 b=c.changeBoard(b,{type:'lock',id:'a',locked:false},now);b=c.changeBoard(b,{type:'remove',ids:['a']},now);assert.equal(b.connectors.length,0);
 let p=model.makeProject({id:'p',tasks:[{id:'task',title:'Canonical',start:'2026-11-07',due:'2026-11-09'}]});const tasks=JSON.stringify(p.tasks);p=c.saveBoard(p,board(),null);const changed=c.changeBoard(p.canvases[0],{type:'add',objects:[note()]},now);p=c.saveBoard(p,changed,0);assert.equal(JSON.stringify(p.tasks),tasks);assert.throws(()=>c.saveBoard(p,changed,0),/changed/);
});
test('Canvas comments, snapshots, project/workspace imports and board backups round-trip with remapped references',()=>{
 let b=c.changeBoard(board(),{type:'add',objects:[note('a'),note('b')]},now);
 b=c.changeBoard(b,{type:'connect',edge:{id:'edge',from:'a',to:'b',label:'sequence'}},now);
 b=c.changeBoard(b,{type:'thread',thread:{id:'thread',objectId:'a',messages:[{id:'m',authorId:c.LOCAL_OWNER,text:'Confirm scope',at:now}]}},now);
 b=c.changeBoard(b,{type:'reply',id:'thread',message:{id:'m2',text:'Confirmed',at:now}},now);b=c.changeBoard(b,{type:'resolve',id:'thread',resolved:true},now);
 let serial=0;const imported=c.importBoard(c.exportBoard(b),{id:'copy',projectId:'p',now,nextId:()=>`copy-${++serial}`});assert.equal(imported.objects.length,2);assert.equal(imported.connectors[0].from,imported.objects[0].id);assert.equal(imported.threads[0].objectId,imported.objects[0].id);assert.equal(imported.threads[0].messages.length,2);assert.equal(imported.threads[0].resolvedAt,now);
 const p=model.makeProject({id:'p',canvases:[b]});assert.deepEqual(model.importProject(JSON.parse(JSON.stringify(p))).canvases,[b]);
 const ws=model.normalizeWorkspace({projects:[p],selectedId:'p'});assert.deepEqual(model.normalizeWorkspace(JSON.parse(JSON.stringify(ws))).projects[0].canvases,[b]);
 const content=c.contentOf(b),removed=c.changeBoard(b,{type:'remove',ids:['a']},now),undo=c.changeBoard(removed,{type:'restore',content},now);assert.equal(undo.objects.length,2);assert.equal(undo.revision,removed.revision+1);
});
test('connector edits/deletion and element deletion are undoable; viewport saves do not change content revisions',()=>{
 let b=c.changeBoard(board(),{type:'add',objects:[note('a'),{...note('b'),x:400}]},now);b=c.changeBoard(b,{type:'connect',edge:{id:'e',from:'a',to:'b',label:'',style:'curve'}},now);
 b=c.changeBoard(b,{type:'editConnector',id:'e',patch:{label:'Feeds into',style:'straight'}},now);assert.equal(b.connectors[0].style,'straight');assert.equal(b.connectors[0].label,'Feeds into');const before=c.contentOf(b);
 const gone=c.changeBoard(b,{type:'disconnect',id:'e'},now);assert.equal(gone.connectors.length,0);assert.equal(gone.objects.length,2);b=c.changeBoard(gone,{type:'restore',content:before},now);assert.equal(b.connectors.length,1);
 const p=model.makeProject({id:'p',canvases:[b]}),moved=c.saveViewport(p,b.id,{x:-200,y:80,scale:1.5},b.revision);assert.equal(moved.canvases[0].revision,b.revision);assert.equal(moved.canvases[0].updatedAt,b.updatedAt);assert.equal(moved.canvases[0].objects[0],b.objects[0]);assert.deepEqual(moved.canvases[0].objects,b.objects);
 assert.throws(()=>c.deleteBoard(p,b.id,b.revision),/Archive/);const archived=c.changeBoard(b,{type:'archive',archived:true},now),saved=c.saveBoard(p,archived,b.revision);assert.equal(c.deleteBoard(saved,b.id,archived.revision).canvases.length,0);
});
test('copying a frame includes nested children, internal connections and comment anchors without external links',()=>{
 let b=c.changeBoard(board(),{type:'add',objects:[{...note('frame'),type:'frame'}, {...note('child'),groupId:'frame'},note('outside')]},now);
 b=c.changeBoard(b,{type:'connect',edge:{id:'inside',from:'frame',to:'child'}},now);b=c.changeBoard(b,{type:'connect',edge:{id:'external',from:'child',to:'outside'}},now);
 const selection=c.selectionBoard(b,['frame']);assert.deepEqual(selection.objects.map(o=>o.id),['frame','child']);assert.deepEqual(selection.connectors.map(e=>e.id),['inside']);let serial=0;const copy=c.duplicateBoard(selection,{id:b.id,now,nextId:()=>`copy${serial++}`});assert.equal(copy.objects[1].groupId,copy.objects[0].id);assert.equal(copy.connectors[0].to,copy.objects[1].id);assert.equal(b.objects.length,3);
});
test('roadmap snapshots reject impossible and reversed dates before rendering',()=>{
 const base={kind:'roadmap',title:'Plan',lines:[],tasks:[{id:'t',title:'Task',start:'2026-02-30',due:'2026-03-01'}]};assert.throws(()=>c.projection(base),/date/);assert.throws(()=>c.projection({...base,tasks:[{...base.tasks[0],start:'2026-03-02'}]}),/date range/);assert.equal(c.projection({...base,tasks:[{...base.tasks[0],start:'2026-02-28'}]}).tasks.length,1);
});
test('drawing-heavy board backups stay inside their own import byte limit and round-trip intact',()=>{
 const points=Array.from({length:2000},(_,i)=>({x:19999-i,y:19998-i}));let b=board();b=c.changeBoard(b,{type:'add',objects:Array.from({length:16},(_,i)=>c.createObject({id:'stroke'+i,boardId:b.id,type:'draw',width:20000,height:20000,points,now}))},now);const backup=c.exportBoard(b),{utf8Bytes}=require('../../src/store/importFiles.cjs');assert.ok(utf8Bytes(backup)<=c.MAX_BYTES+10000);let serial=0;const round=c.importBoard(backup,{id:'restored',projectId:'p',now,nextId:()=>`r${serial++}`});assert.equal(round.objects.length,16);assert.deepEqual(round.objects.at(-1).points,b.objects.at(-1).points);
});
