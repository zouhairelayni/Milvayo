'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const model=require('../src/model.cjs'), pu=model.powerUps, boards=model.boards;
function project(){return model.makeProject({name:'Power-Up fixture',code:'PU',tasks:[{id:'PU-1',title:'Card',status:'Backlog',due:'2026-11-12'}]})}
function boardWithGitHub(){let p=project();p=pu.toggle(p,boards.DEFAULT_BOARD_ID,'github');return p}
test('legacy projects retain an empty Power-Up set and no linked resources',()=>{const p=project();assert.deepEqual(p.powerUps,{});assert.deepEqual(p.tasks[0].githubLinks,[]);model.validateProject(p)});
test('enable and disable built-in extensions per board',()=>{let p=project();p=boards.createBoard(p,'Engineering');const b=p.boards[1].id;p=pu.toggle(p,b,'calendar');assert.equal(pu.enabled(p,b,'calendar'),true);assert.equal(pu.enabled(p,boards.DEFAULT_BOARD_ID,'calendar'),false);p=pu.toggle(p,b,'calendar');assert.equal(pu.enabled(p,b,'calendar'),false);assert.throws(()=>pu.toggle(p,b,'fake'));});
test('deleted board cleans its Power-Ups and preserves tasks',()=>{let p=boards.createBoard(project(),'Engineering');const b=p.boards[1].id;p=pu.toggle(p,b,'github');p=boards.assignBoard(p,'PU-1',b);p=boards.deleteBoard(p,b);assert.equal(p.tasks[0].boardId,boards.DEFAULT_BOARD_ID);assert.equal(p.powerUps[b],undefined);model.validateProject(p);});
test('reject unknown Power-Ups and orphaned board settings on import',()=>{assert.throws(()=>model.makeProject({powerUps:{missing:['github']}}),/missing board/);assert.throws(()=>model.makeProject({powerUps:{'board-default':['github','github']}}),/Invalid Power-Up/);});
test('strict GitHub URL support for issue, PR, commit and branch',()=>{
 const samples=[['https://github.com/niyarvo/app/issues/42','issue'],['https://github.com/niyarvo/app/pull/2','pull'],['https://github.com/niyarvo/app/commit/a1b2c3d4','commit'],['https://github.com/niyarvo/app/tree/feature/custom-boards','branch']];
 for(const [url,type] of samples){const parsed=pu.parseGithubUrl(url);assert.equal(parsed.type,type);assert.equal(parsed.url,url)}
});
test('reject GitHub spoofing, alternate protocols and ambiguous paths',()=>{
 const bad=['http://github.com/a/b/issues/1','https://github.com.evil.test/a/b/issues/1','https://evil.test/github.com/a/b/pull/3','https://user:pass@github.com/a/b/pull/3','https://github.com/a/b/issues/1?token=hidden','https://github.com/a/b/issues/0','https://github.com/a/b/../../etc','https://github.com/a/b/pull/notnum','https://github.com/a/b/commit/nope'];
 for(const url of bad)assert.throws(()=>pu.parseGithubUrl(url),undefined,url);
});
test('link requires enabled Power-Up and valid task',()=>{const p=project();assert.throws(()=>pu.addLink(p,'PU-1','https://github.com/a/b/pull/1'),/Enable/);assert.throws(()=>pu.addLink(boardWithGitHub(),'missing','https://github.com/a/b/pull/1'),/Task not found/);});
test('link additions, dedupe, metadata and removal survive JSON roundtrip',()=>{
 let p=boardWithGitHub();p=pu.addLink(p,'PU-1','https://github.com/org/repo/pull/31');assert.throws(()=>pu.addLink(p,'PU-1','https://github.com/org/repo/pull/31'),/already attached/);
 p=pu.setPreview(p,'PU-1','https://github.com/org/repo/pull/31',{title:'Review UI',state:'merged'});
 let round=model.importProject(JSON.parse(JSON.stringify(p)));assert.equal(round.tasks[0].githubLinks.length,1);assert.equal(round.tasks[0].githubLinks[0].state,'merged');assert.equal(round.tasks[0].githubLinks[0].title,'Review UI');
 round=pu.removeLink(round,'PU-1','https://github.com/org/repo/pull/31');assert.equal(round.tasks[0].githubLinks.length,0);
});
test('disabling a Power-Up never deletes linked references',()=>{let p=boardWithGitHub();p=pu.addLink(p,'PU-1','https://github.com/a/b/issues/1');p=pu.toggle(p,boards.DEFAULT_BOARD_ID,'github');assert.equal(pu.enabled(p,boards.DEFAULT_BOARD_ID,'github'),false);assert.equal(p.tasks[0].githubLinks.length,1);});
test('validate import sanitizes malicious links without ever storing credentials',()=>{assert.throws(()=>model.makeProject({tasks:[{title:'Card',githubLinks:[{url:'https://github.com/a/b/issues/1?secret=x'}]}]}),/clean/);});
test('public preview reads only GitHub API and handles PR status without token',async()=>{
 const link=pu.parseGithubUrl('https://github.com/example/repo/pull/8');let requested='';
 const preview=await pu.fetchPublicPreview(link,async(url,opts)=>{requested=url;assert.ok(!Object.keys(opts.headers).includes('Authorization'));return {ok:true,json:async()=>({title:'Ship feature',state:'closed',merged_at:'2026-10-30'})}});
 assert.equal(requested,'https://api.github.com/repos/example/repo/pulls/8');assert.equal(preview.state,'merged');
});
test('public API errors report private repos/rate limits honestly',async()=>{const l=pu.parseGithubUrl('https://github.com/a/b/issues/1');await assert.rejects(pu.fetchPublicPreview(l,async()=>({ok:false,status:404})),/private/);await assert.rejects(pu.fetchPublicPreview(l,async()=>({ok:false,status:403})),/rate limit/);});
test('due-date and aging extension metrics do not require network',()=>{let p=project();p=pu.toggle(p,boards.DEFAULT_BOARD_ID,'calendar');assert.equal(pu.dueSoon(p,boards.DEFAULT_BOARD_ID,'2026-11-01').length,1);assert.equal(pu.dueSoon(p,boards.DEFAULT_BOARD_ID,'2026-12-01').length,0);assert.equal(pu.ageInDays({updatedAt:'2026-10-01'},new Date('2026-10-15T00:00:00Z')),14);});
test('Atlas fixture upgrades without losing existing tasks or sprints',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const file=path.join(__dirname,'../examples/ATLAS-MOCK.project.json');
 const raw=JSON.parse(fs.readFileSync(file,'utf8'));const p=model.importProject(raw);
 assert.equal(p.tasks.length,73);assert.equal(p.sprints.length,3);
 const withExt=pu.toggle(p,boards.DEFAULT_BOARD_ID,'checklist');assert.equal(withExt.tasks.length,73);
 const saved=model.importProject(JSON.parse(JSON.stringify(withExt)));
 assert.equal(pu.enabled(saved,boards.DEFAULT_BOARD_ID,'checklist'),true);
});
