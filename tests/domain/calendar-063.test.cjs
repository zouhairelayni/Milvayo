// /tests/domain/calendar-063.test.cjs
'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict');
const{validDay,shiftMonth,monthCells,toggleDate}=require('../../src/domain/calendar.cjs');
const{scheduleSeries,pointsFor,linePath,radialSegments}=require('../../src/domain/dashboard.cjs');
test('inline month grids use real ISO days, Monday-first rows and leap-year rollover',()=>{
 for(const bad of [null,{},['2026-11-06'],42])assert.equal(validDay(bad),false);
 assert.equal(validDay('2024-02-29'),true);assert.equal(validDay('2026-02-29'),false);assert.equal(validDay('2026-04-31'),false);assert.equal(validDay('0001-01-01'),true);
 const feb=monthCells('2024-02');assert.equal(feb.length,42);assert.equal(feb[0].iso,'2024-01-29');assert.equal(feb.filter(d=>d.inMonth).length,29);assert.equal(new Set(feb.map(d=>d.iso)).size,42);
 assert.equal(shiftMonth('2026-12',1),'2027-01');assert.equal(shiftMonth('2026-01',-1),'2025-12');assert.equal(shiftMonth('0001-01',-1),'0001-01');assert.equal(shiftMonth('9999-12',1),'9999-12');assert.deepEqual(monthCells('invalid'),[]);
});
test('calendar exception toggles are sorted, deduplicated, immutable and persistence-safe',()=>{
 const initial=['2026-11-06','2026-11-06','bad'];const next=toggleDate(initial,'2026-11-07');assert.deepEqual(initial,['2026-11-06','2026-11-06','bad']);assert.deepEqual(next,['2026-11-06','2026-11-07']);assert.deepEqual(toggleDate(next,'2026-11-06'),['2026-11-07']);assert.deepEqual(JSON.parse(JSON.stringify(next)),next);assert.equal(toggleDate(initial,'2026-02-30'),initial);
});
test('schedule chart reports due distribution without inventing daily completion history or mutating tasks',()=>{
 const tasks=[{id:'a',due:'2026-12-31',status:'Done'},{id:'b',due:'2027-01-01',status:'Backlog'},{id:'c',due:'',status:'Done'}],copy=JSON.stringify(tasks);
 const days=scheduleSeries(tasks,'2026-12-31');assert.equal(days.length,7);assert.deepEqual(days[0],{date:'2026-12-31',label:'Thu',value:1,done:1,ids:['a']});assert.equal(days[1].value,1);assert.equal(days[1].done,0);assert.equal(JSON.stringify(tasks),copy);assert.deepEqual(scheduleSeries(tasks,'2026-02-30'),[]);
});
test('chart geometry stays finite for empty, zero, negative and malformed values',()=>{
 for(const v of [[],[0,0],[NaN,Infinity,-3],[Number.MAX_VALUE,Number.MAX_VALUE],[3]]){
  const points=pointsFor(v,320,180);assert.ok(points.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));assert.doesNotMatch(linePath(points),/NaN|Infinity/);
  const arcs=radialSegments(v);assert.ok(arcs.every(a=>Number.isFinite(a.length)&&Number.isFinite(a.offset)&&a.length>=0));assert.ok(arcs.reduce((n,a)=>n+a.share,0)<=1.000001);
 }
});
