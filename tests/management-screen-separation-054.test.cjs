'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const relations=require('../src/projectRelations.cjs');

test('Projects, Programs and Portfolios have independent screens and one connector',()=>{
 const app=read('ModernApp.js');
 for(const name of ['Projects','Programs','Portfolios']){
  const source=read(`src/screens/${name}.js`);
  assert.match(source,new RegExp(`(?:export function|export default function) ${name}\\(`));
  assert.match(app,new RegExp(`from './src/screens/${name}'`));
  assert.match(source,/projectRelations\.cjs/);
 }
 assert.equal(fs.existsSync(path.join(root,'src/screens/ProjectsPrograms.js')),false);
 assert.match(app,/group: 'Governance'/);
 assert.doesNotMatch(read('src/screens/Workspace.js'),/export function Portfolios\(/);
});

test('project task cards display scalar task counts, never task-object arrays',()=>{
 const projects=read('src/screens/Projects.js');
 assert.match(projects, /projectMetric\(p\)/);
 assert.doesNotMatch(projects,/\{p\.tasks\} tasks/);
 assert.deepEqual(relations.projectSummary({tasks:[{id:'a',status:'Done'},{id:'b',status:'Backlog'}]}),{taskCount:2,doneCount:1,progress:.5});
 assert.equal(relations.projectSummary({tasks:'invalid'}).taskCount,0);
});

test('program and portfolio membership summarizes existing workspace projects without copying task data',()=>{
 const one={id:'p1',name:'Alpha',tasks:[{id:'t1',status:'Done'},{id:'t2',status:'Backlog'}]};
 const two={id:'p2',name:'Beta',tasks:[{id:'t3',status:'Done'}]};
 const ws={projects:[one,two],programs:[{id:'g1',projectIds:['p1','p2']}],portfolios:[{id:'f1',projectIds:['p1','p2']}]};
 const summary=relations.programSummary(ws,ws.programs[0]);
 assert.equal(summary.projectCount,2);
 assert.equal(summary.taskCount,3);
 assert.equal(summary.doneCount,2);
 assert.deepEqual(relations.portfolioSummary(ws,ws.portfolios[0]).projectNames,['Alpha','Beta']);
 const removed=relations.removeProjectLinks(ws,'p1');
 assert.deepEqual(removed.programs[0].projectIds,['p2']);
 assert.deepEqual(removed.portfolios[0].projectIds,['p2']);
 assert.deepEqual(ws.programs[0].projectIds,['p1','p2'],'original workspace must not mutate');
 assert.strictEqual(removed.projects,ws.projects,'no task/project copying');
});
