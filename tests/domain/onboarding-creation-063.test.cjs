// /tests/domain/onboarding-creation-063.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),babel=require('@babel/core');
const model=require('../../src/domain/model.cjs'),tools=require('../../src/domain/projectTools.cjs'),plan=require('../../src/screens/onboarding/onboardingPlan.cjs');
const source=fs.readFileSync(path.resolve(__dirname,'../../src/store/store.js'),'utf8'),ast=babel.parseSync(source,{babelrc:false,configFile:false,parserOpts:{plugins:['jsx']}});let node;babel.traverse(ast,{ObjectProperty(p){if(p.node.key.name==='createProject')node=p.node.value;}});
test('starter project creation is one validated transaction; original data remains intact and tools survive import',()=>{
 for(const starter of plan.STARTERS){let workspace=model.createWorkspace(),commits=0;const original=JSON.stringify(workspace.projects),create=vm.runInNewContext('('+source.slice(node.start,node.end)+')',{model,projectTools:tools,setFault(){},trans:fn=>{workspace=model.normalizeWorkspace(fn(workspace));commits++;return true;}});
 const id=create({name:'Garden',tools:plan.starterTools(starter.id)});assert.ok(id);assert.equal(commits,1);assert.equal(workspace.projects.length,2);assert.equal(JSON.stringify(workspace.projects.slice(0,1)),original);assert.equal(workspace.selectedId,id);assert.deepEqual(workspace.projects.at(-1).tools,plan.starterTools(starter.id));assert.equal(tools.screenOn(workspace.projects.at(-1).tools,starter.screen),true);
 assert.deepEqual(model.normalizeWorkspace(JSON.parse(JSON.stringify(workspace))).projects.at(-1).tools,plan.starterTools(starter.id));}
});
test('ordinary creation stays lean and invalid tool overrides reject before any transaction',()=>{
 assert.equal(tools.initialTools(),tools.LEAN);for(const value of [null,[],{missing:false},{sprints:'no'}])assert.throws(()=>tools.initialTools(value),/Invalid initial/);
 let commits=0;const create=vm.runInNewContext('('+source.slice(node.start,node.end)+')',{model,projectTools:tools,setFault(){},trans:()=>{commits++;return false;}});assert.equal(create({name:'Garden',tools:plan.starterTools('board')}),null);assert.equal(commits,1);assert.throws(()=>create({name:'Garden',tools:{missing:true}}),/Invalid initial/);assert.equal(commits,1);
});
