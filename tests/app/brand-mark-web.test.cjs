// /tests/app/brand-mark-web.test.cjs
 'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..', '..');
test('launcher, adaptive, splash and web icons use actual Niyarvo artwork',()=>{for(const x of ['assets/icon.png','assets/adaptive-icon.png','assets/splash-icon.png','assets/brand-symbol.png','assets/brand-wordmark-white.png','assets/brand-wordmark-dark.png','public/icons/icon-192.png','public/icons/icon-512.png']){const f=path.join(root,x);assert.ok(fs.statSync(f).size>1000,x)}});
test('single modern shell uses branded imagery instead of mock text-only logo',()=>{const s=require('../helpers/shell-source.cjs')();assert.match(s,/niyarvo-projects-white\.png/);assert.match(s,/niyarvo-projects-dark\.png/);assert.ok(fs.readFileSync(path.join(root,'assets/niyarvo-projects-white.svg'),'utf8').includes('>PROJECTS</text>'))});
