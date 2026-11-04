// /tests/governance/governance-open-project-0516.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=x=>fs.readFileSync(path.join(__dirname,'..', '..',x),'utf8');
test('Open project from Portfolios and Programs navigates to the project detail',()=>{
 const app=read('src/app/ModernApp.js');
 assert.ok(app.includes('const openProject')&&app.includes("go('projects')")&&app.includes('projectRequest={projectRequest}'));
 for(const f of ['Portfolios','Programs']){const s=read(`src/screens/governance/${f}.js`);assert.ok(s.includes('openProject?openProject(id)'));assert.ok(!s.includes('onPress={()=>switchProject('))}
 const p=read('src/screens/governance/Projects.js');assert.ok(p.includes('projectRequest')&&p.includes('onProjectRequestHandled'));
});
test('Portfolio and Program create/edit editors are accessible sheets rather than inline forms',()=>{
 for(const f of ['Portfolios','Programs']){const s=read(`src/screens/governance/${f}.js`);assert.ok(s.includes('<Sheet visible={!!editing}'));assert.ok(s.includes("title={editing==='new'"))}
});
