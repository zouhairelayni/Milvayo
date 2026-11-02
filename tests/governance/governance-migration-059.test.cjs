// /tests/governance/governance-migration-059.test.cjs
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..', '..');
const model=require('../../src/domain/model.cjs');
const programs=require('../../src/domain/programs.cjs');
const summary=require('../../src/domain/governanceSummary.cjs');
const {normalizeGovernance}=require('../../src/domain/governanceCore.cjs');
const code=p=>fs.readFileSync(path.join(root,p),'utf8');

test('Timeline navigation marks rotate horizontally in drawer and bottom tab, not the actual chart',()=>{
 const s=require('../helpers/shell-source.cjs')();
 assert.match(s,/k === 'timeline' \? \{ transform: \[\{ rotate: '90deg' \}\] \}/);
 assert.equal((s.match(/k === 'timeline' \? \{ transform: \[\{ rotate: '90deg' \}\] \}/g)||[]).length,2);
 assert.match(s,/\['timeline', 'Timeline', 'bar-chart-2'\]/);
 assert.doesNotMatch(code('src/screens/timeline/Timeline.js'),/rotate: '90deg'/);
});
test('Governance navigation has one independent entry per screen, in required order',()=>{
 const s=code('src/app/ModernApp.js');const nav=s.split("group: 'Governance'")[1].split("group: 'Operate'")[0];
 assert.ok(nav.indexOf("['projects'")<nav.indexOf("['portfolios'"));
 assert.ok(nav.indexOf("['portfolios'")<nav.indexOf("['programs'"));
 assert.doesNotMatch(nav,/enterprise|Entreprise PM/);
});
test('Project governance round-trip preserves statuses, risks, WBS and budgets',()=>{
 const g=normalizeGovernance({info:{phase:'Planning',health:'At risk'},docs:{businessCase:{status:'Approved',values:{goal:'Launch'}}},budget:{contingencyPct:12,lines:[{id:'b',planned:150,committed:50,actual:30}]},risks:[{id:'r',title:'Delay',prob:5,impact:4}],wbs:[{id:'w0',parent:null,name:'',hours:0},{id:'w1',parent:'w0',name:'Scope',hours:8}]});
 const p=model.makeProject({id:'p1',name:'Governance',governance:g,tasks:[{id:'t1',title:'Task',estimateHours:10,owner:'Manager'}],resources:[{id:'r1',name:'Manager',hourlyRate:100}]});
 const ws=model.normalizeWorkspace({...model.createWorkspace(),projects:[p],selectedId:p.id});
 const round=model.normalizeWorkspace(JSON.parse(JSON.stringify(ws)));
 assert.equal(round.projects[0].governance.docs.businessCase.status,'Approved');
 assert.equal(round.projects[0].governance.risks[0].prob,5);
 assert.equal(round.projects[0].governance.wbs.length,2);
 assert.equal(round.projects[0].governance.budget.contingencyPct,12);
 const m=summary.projectMetric(round.projects[0]);
 assert.equal(m.planned,1150); // leaf estimate (10h * $100) plus $150 non-labour
});
test('Project in one program enforced across direct and nested portfolio membership',()=>{
 const projects=[model.makeProject({id:'p1',name:'One'}),model.makeProject({id:'p2',name:'Two'})];
 const ws=model.normalizeWorkspace({...model.createWorkspace(),projects,selectedId:'p1',portfolios:[{id:'f1',name:'One',projectIds:['p1']},{id:'f2',name:'Two',projectIds:['p2']}]});
 const one=programs.save(ws,{id:'a',name:'Program A',portfolioIds:['f1']});
 assert.throws(()=>programs.save(one,{id:'b',name:'Program B',projectIds:['p1']}),/already belongs/);
 assert.throws(()=>programs.save(one,{id:'b',name:'Program B',portfolioIds:['f1']}),/already belongs/);
 const two=programs.save(one,{id:'b',name:'Program B',portfolioIds:['f2']});
 assert.equal(summary.programMetric(two,two.programs[0]).list.length,1);
 assert.equal(summary.programMetric(two,two.programs[1]).list.length,1);
});
test('Workspace recovery snapshot retains governance records and relationships',()=>{
 const base=model.createWorkspace();const id=base.selectedId;
 const ws=model.normalizeWorkspace({...base,portfolios:[{id:'pf',name:'Delivery',projectIds:[id]}],programs:[{id:'pg',name:'Program',portfolioIds:['pf']}]});
 const snap=model.workspaceSnapshot(ws);
 const restored=model.normalizeWorkspace({...snap.workspace,backups:[]});
 assert.equal(restored.programs[0].portfolioIds[0],'pf');
 assert.equal(restored.portfolios[0].projectIds[0],id);
 assert.ok(restored.projects[0].governance);
});