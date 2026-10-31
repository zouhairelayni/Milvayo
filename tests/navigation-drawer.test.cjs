'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'..','App.js'),'utf8');
const sidebar=src.split('const sidebar=(')[1].split('\n const header=')[0];
const overlay=src.split('testID="niyarvo-navigation-overlay"')[1].split('{message!==')[0];

test('mobile and Web drawer navigation is inside a bounded vertical ScrollView',()=>{
 assert.match(sidebar,/<ScrollView[\s\S]*?testID="niyarvo-navigation-scroll"/);
 assert.match(sidebar,/style=\{\{flex:1,minHeight:0\}\}/);
 assert.match(sidebar,/\{nav\.map\(item=>/);
 assert.ok(sidebar.indexOf('<ScrollView')<sidebar.indexOf('{nav.map('));
 assert.ok(sidebar.indexOf('{nav.map(')<sidebar.indexOf('</ScrollView>'));
 assert.doesNotMatch(sidebar,/<View style=\{\{flex:1\}\}\s*\/>/);
});
test('close button and workspace switcher are outside scrolling links',()=>{
 assert.match(sidebar,/label="Close navigation"/);
 assert.match(sidebar,/accessibilityLabel="Switch project"/);
 assert.ok(sidebar.indexOf('label="Close navigation"')<sidebar.indexOf('<ScrollView'));
 assert.ok(sidebar.indexOf('accessibilityLabel="Switch project"')<sidebar.indexOf('<ScrollView'));
});
test('in-tree overlay avoids Modal portal and can be dismissed by tapping outside',()=>{
 assert.match(src,/\{menu&&!desktop&&<View testID="niyarvo-navigation-overlay"/);
 assert.match(overlay,/accessibilityLabel="Close navigation backdrop"/);
 assert.match(overlay,/onPress=\{\(\)=>setMenu\(false\)\}/);
 assert.match(overlay,/position:'absolute'/);
 assert.doesNotMatch(overlay,/<SafeModal/);
});
test('navigation rows close drawer after changing tab and support touch targets',()=>{
 assert.match(sidebar,/setTab\(item\);setMenu\(false\)/);
 assert.match(sidebar,/minHeight:44/);
});

test('Android system Back and Web Escape dismiss the in-tree drawer',()=>{
 assert.match(src,/BackHandler\.addEventListener\('hardwareBackPress'/);
 assert.match(src,/window\.addEventListener\('keydown',onEscape\)/);
 assert.match(src,/e\.key==='Escape'/);
});
