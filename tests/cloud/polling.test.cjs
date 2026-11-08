// /tests/cloud/polling.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createPollingPolicy,simulatePolling}=require('../../src/cloud/polling.cjs');
test('adaptive polling is bounded and resets for changes or queued work',()=>{const p=createPollingPolicy();assert.equal(p.next(),5000);assert.equal(p.observe(),10000);assert.equal(p.observe(),20000);assert.equal(p.observe(),40000);assert.equal(p.observe(),60000);assert.equal(p.observe(),60000);assert.equal(p.next({visible:false}),120000);assert.equal(p.observe({changed:true}),5000);assert.equal(p.observe({pending:true}),5000);assert.equal(p.reset(),5000);assert.throws(()=>createPollingPolicy({idleMs:1}));});
test('idle modeled sessions reduce requests without pretending to measure user behavior',()=>{const modeled=simulatePolling();assert.equal(modeled.requests,22);assert.equal(modeled.worstVisibilityLatencyMs,60000);assert.ok(modeled.requests<240);const chat=simulatePolling({durationMs:360000,activeMs:3000,idleMs:30000,hiddenMs:120000});assert.ok(chat.requests<120);});
