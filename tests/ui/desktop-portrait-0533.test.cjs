// /tests/ui/desktop-portrait-0533.test.cjs
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {isDesktopLayout}=require('../../src/ui/layoutMode.cjs');
test('desktop-browser Web works at 320, portrait, landscape and full-screen widths',()=>{
 for(const width of [320,360,390,430,700,768,1440])assert.equal(isDesktopLayout(width,'web','auto',false),true,width+'px Web');
 assert.equal(isDesktopLayout(319,'web','auto'),false);
});
test('native portrait keeps its phone UI and Web preference is Web-only',()=>{
 for(const platform of ['android','ios']){assert.equal(isDesktopLayout(390,platform,'auto'),false);assert.equal(isDesktopLayout(390,platform,'desktop'),false)}
 assert.equal(isDesktopLayout(319,'web','desktop'),true);
});
