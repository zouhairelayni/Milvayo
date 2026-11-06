// /tests/app/notice-safe-anchor-055.test.cjs
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..', '..',p),'utf8');
const {noticeTopOffset}=require('../../src/components/notice/noticePlacement.cjs');

test('top placement preserves iOS notch and Android system status area',()=>{
 assert.equal(noticeTopOffset({top:59},'ios',0),69);
 assert.equal(noticeTopOffset({top:24},'android',24),34);
 assert.equal(noticeTopOffset({top:0},'android',28),38,'fallback when edge-to-edge returns zero inset');
 assert.equal(noticeTopOffset({top:38},'android',24),48);
 assert.equal(noticeTopOffset({top:0},'web',0),10);
 assert.equal(noticeTopOffset({},'ios'),10);
 assert.equal(noticeTopOffset({top:-10},'ios'),10);
});
