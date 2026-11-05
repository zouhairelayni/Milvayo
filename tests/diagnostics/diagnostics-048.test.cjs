// /tests/diagnostics/diagnostics-048.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../../src/diagnostics/core.cjs');
const src = p => fs.readFileSync(path.join(__dirname,'..', '..',p),'utf8');
test('crash recorder distinguishes confirmed exception from unclean prior session',()=>{
 const s=core.fresh('test',1000,{platform:'android',os:'36',version:'0.4.8'});
 s.previous={active:true,updatedAt:950};
 core.addEvent(s,'screen opened','board',1100);
 core.addCrash(s,{source:'React render boundary',name:'ReferenceError',message:"Property 'useState' doesn't exist",screen:'sprints',stack:'Delivery.js:26'},1200);
 core.addCrash(s,{source:'React render boundary',name:'ReferenceError',message:"Property 'useState' doesn't exist",screen:'sprints',stack:'Delivery.js:26'},1201);
 assert.equal(s.crashes.length,1);
 assert.equal(s.crashes[0].count,2);
 const r=core.reportCrash(s);
 assert.match(r,/sprints/); assert.match(r,/Delivery.js:26/);
 assert.match(r,/NOT proof of crash/);
});
test('redacts credentials and account identifiers in copied reports',()=>{
 const text=core.clean('Authorization: Bearer my_secret_1234567890 api_key=verysecret password=hunter2 foo@company.com https://example.com?token=helloworld /data/data/com.termux/files/home/Hi');
 for(const secret of ['my_secret_1234567890','verysecret','hunter2','foo@company.com','token=helloworld','com.termux'])assert.equal(text.includes(secret),false,secret);
});
test('diagnostics keep bounded memory and report slow navigation and render data',()=>{
 const s=core.fresh('test',1000);
 for(let i=0;i<130;i++)core.addEvent(s,'step',String(i),i+1000);
 for(let i=0;i<80;i++)core.addSlow(s,'navigation','board',500,i+1000);
 assert.equal(s.events.length,90);
 assert.equal(s.slow.length,60);
 s.render.board={count:2,sum:100,max:70};
 assert.match(core.reportPerf(s,2000),/board: 2 renders, avg 50ms, max 70ms/);
});
test('diagnostics connected to Settings, render errors, navigation and React profiler',()=>{
 const app=require('../helpers/shell-source.cjs')();
 const settings=src('src/screens/workspace/Workspace.js');
 const d=src('src/diagnostics/DiagnosticsPanel.js');
 assert.match(app,/diagnosticMonitor\.captureError\(/);
 assert.match(app,/diagnosticMonitor\.recordScreen\(k\)/);
 assert.match(app,/diagnosticMonitor\.recordRender\(/);
 assert.match(settings,/<DiagnosticsPanel \/>/);
 assert.match(d,/Clipboard\.setStringAsync\(report\)/);
 assert.match(d,/Crash reports/);
 assert.match(d,/Performance monitor/);
});
test('timeline shows all scheduled rows with viewport virtualization, no paging buttons',()=>{
 const s=src('src/screens/timeline/Timeline.js');
 assert.doesNotMatch(s,/Next rows|Previous rows|Previous window|Next window/);
 assert.match(s,/const rows = allScheduled/);
 assert.match(s,/paintedRows = rows\.slice/);
 assert.match(s,/label=\{showItems \? 'Hide items' : 'Show items'\}/);
 assert.match(s,/label="Today"/);
});
test('sprint screen imports useState after sprint management refactor',()=>{
 const s=src('src/screens/delivery/Delivery.js');
 assert.match(s,/import \{ (useEffect, )?(useMemo, )?(useRef, )?useState \} from 'react';/);
});
