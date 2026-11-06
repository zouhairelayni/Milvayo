// /tests/store/project-copy-context-063.test.cjs
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const babel=require('@babel/core');
const model=require('../../src/domain/model.cjs');
const source=fs.readFileSync(path.resolve(__dirname,'../../src/store/store.js'),'utf8');
const ast=babel.parseSync(source,{babelrc:false,configFile:false,parserOpts:{plugins:['jsx']}});
let action;
babel.traverse(ast,{ObjectProperty(p){if(p.node.key.name==='duplicateProject')action=p.node.value;}});
function setup(initial){
 let workspace=initial;
 const duplicate=vm.runInNewContext('('+source.slice(action.start,action.end)+')',{model,trans:fn=>{
  try{const next=fn(workspace);workspace=model.normalizeWorkspace(next);return true;}catch{return false;}
 }});
 return {duplicate,get:()=>workspace};
}

test('project template duplication preserves the original selected project and survives persistence/import normalization',()=>{
 const workspace=model.createWorkspace(),before=JSON.stringify(workspace.projects[0]),h=setup(workspace);
 const id=h.duplicate(workspace.selectedId,'Second project');assert.ok(id);assert.notEqual(id,workspace.selectedId);
 const next=h.get();assert.equal(next.projects.length,workspace.projects.length+1);assert.equal(next.selectedId,workspace.selectedId);
 assert.equal(JSON.stringify(next.projects[0]),before);assert.equal(next.projects.at(-1).name,'Second project');
 const restored=model.normalizeWorkspace(JSON.parse(JSON.stringify(next)));assert.equal(restored.selectedId,workspace.selectedId);assert.ok(restored.projects.some(p=>p.id===id));restored.projects.forEach(model.validateProject);
});

test('invalid project or a full workspace rejects a copy without changing selection or persisted data',()=>{
 let initial=model.createWorkspace(),h=setup(initial);assert.equal(h.duplicate('missing','Copy'),null);assert.equal(h.get(),initial);
 initial={...initial,projects:Array.from({length:30},(_,i)=>({...initial.projects[0],id:i?`project-${i}`:initial.selectedId,code:`P${i}`}))};
 h=setup(initial);const before=JSON.stringify(initial);assert.equal(h.duplicate(initial.selectedId,'Copy'),null);assert.equal(JSON.stringify(h.get()),before);
});
