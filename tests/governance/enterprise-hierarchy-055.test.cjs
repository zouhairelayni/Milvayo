// /tests/governance/enterprise-hierarchy-055.test.cjs
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..', '..');
const read=n=>fs.readFileSync(path.join(root,n),'utf8');
const model=require('../../src/domain/model.cjs');
const programs=require('../../src/domain/programs.cjs');
const operations=require('../../src/domain/operations.cjs');
const relations=require('../../src/domain/projectRelations.cjs');
function fixture(){const w=model.createWorkspace();w.projects.push(model.makeProject({name:'Second team',code:'TWO'}));return model.normalizeWorkspace(w)}
function withPortfolio(w,ids,name='Portfolio'){return operations.savePortfolio(w,{name,projectIds:ids})}
test('program contains portfolio, and portfolio contains project without copying tasks',()=>{
 let w=fixture();w=withPortfolio(w,[w.projects[0].id]);const portfolio=w.portfolios[0];
 w=programs.save(w,{name:'Initiative',status:'Active',portfolioIds:[portfolio.id]});
 w=model.normalizeWorkspace(w);
 assert.deepEqual(w.programs[0].portfolioIds,[portfolio.id]);
 const summary=relations.programSummary(w,w.programs[0]);
 assert.equal(summary.portfolioCount,1);assert.equal(summary.projectCount,1);
 assert.equal(summary.taskCount,w.projects[0].tasks.length);
 assert.equal(w.projects.length,2);
 assert.deepEqual(relations.portfolioSummary(w,portfolio).linked.map(p=>p.id),[w.projects[0].id]);
});
test('programs reject unknown portfolio references on edit',()=>{
 const w=fixture();assert.throws(()=>programs.save(w,{name:'Bad',portfolioIds:['not-a-portfolio']}),/Unknown portfolio/);
});
test('legacy direct members survive migration, even when new portfolio membership is added',()=>{
 let w=fixture();w=programs.save(w,{name:'Legacy',projectIds:[w.projects[0].id]});
 w=withPortfolio(w,[w.projects[1].id]);
 w=programs.save(w,{...w.programs[0],portfolioIds:[w.portfolios[0].id]});
 const p=model.normalizeWorkspace(w).programs[0];
 assert.deepEqual(p.projectIds,[w.projects[0].id]);assert.deepEqual(p.portfolioIds,[w.portfolios[0].id]);
 assert.equal(relations.programSummary(w,p).projectCount,2);
});
test('shared projects are deduplicated when several portfolios belong to one program',()=>{
 let w=fixture();const project=w.projects[0];
 w=withPortfolio(w,[project.id],'A');w=withPortfolio(w,[project.id],'B');
 w=programs.save(w,{name:'Shared',portfolioIds:w.portfolios.map(p=>p.id),projectIds:[project.id]});
 const summary=relations.programSummary(w,w.programs[0]);
 assert.equal(summary.portfolioCount,2);assert.equal(summary.projectCount,1);assert.equal(summary.taskCount,project.tasks.length);
});
test('deleting a portfolio unlinks the program without deleting projects',()=>{
 let w=fixture();w=withPortfolio(w,w.projects.map(p=>p.id));w=programs.save(w,{name:'Op',portfolioIds:[w.portfolios[0].id]});
 const id=w.portfolios[0].id;
 w=relations.removePortfolioLinks(operations.deletePortfolio(w,id),id);
 w=model.normalizeWorkspace(w);
 assert.deepEqual(w.programs[0].portfolioIds,[]);assert.equal(w.projects.length,2);
});
test('portfolio memberships and program membership survive snapshot and restore',()=>{
 let w=fixture();w=withPortfolio(w,[w.projects[0].id]);w=programs.save(w,{name:'Group',portfolioIds:[w.portfolios[0].id]});
 const snapshot=model.workspaceSnapshot(w);w=model.normalizeWorkspace(w);
 const r=model.restoreSnapshot({...w,portfolios:[],programs:[]},snapshot);
 assert.equal(relations.programSummary(r,r.programs[0]).projectCount,1);
 assert.equal(r.portfolios[0].projectIds[0],r.projects[0].id);
});
test('Governance group exposes independent screens with one shared relationship connector',()=>{
 const app=read('src/app/ModernApp.js');const nav=app.split('const NAV = [')[1].split('const SCREENS =')[0];
 assert.match(nav,/group: 'Governance'/);
 const block=nav.split("group: 'Governance'")[1].split("group: 'Operate'")[0];
 assert.ok(block.indexOf("['projects'")<block.indexOf("['portfolios'"));
 assert.ok(block.indexOf("['portfolios'")<block.indexOf("['programs'"));
 for(const key of ['projects','portfolios','programs']) assert.equal((block.match(new RegExp("\\['"+key+"'",'g'))||[]).length,1);
 for(const screen of ['Projects','Portfolios','Programs'])assert.ok(read('src/screens/governance/'+screen+'.js').length>300);
 assert.ok(read('src/domain/projectRelations.cjs').length>200);
});
test('mobile Page puts subtitle and action buttons on distinct rows',()=>{
 const source=require('../helpers/ui-source.cjs')();assert.match(source,/flexDirection: wide \? 'row' : 'column'/);
 assert.match(source,/minWidth: 0, flex: wide \? 1 : undefined/);
 assert.match(source,/maxWidth: '100%'/);
});
