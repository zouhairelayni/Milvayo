// /tests/app/release-metadata-060.test.cjs
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const pkg=require('../../package.json');
const app=require('../../app.json');
const lock=require('../../package-lock.json');

test('Milvayo release versions, build numbers and cumulative changelog agree',()=>{
 assert.match(pkg.version,/^\d+\.\d+\.\d+$/);
 assert.equal(pkg.version,app.expo.version);
 assert.equal(pkg.version,lock.version);
 assert.equal(pkg.version,lock.packages[''].version);
 assert.ok(Number.isInteger(app.expo.android.versionCode)&&app.expo.android.versionCode>0);
 assert.match(String(app.expo.ios.buildNumber),/^\d+$/);
 const log=fs.readFileSync(path.join(root,'docs/changelog/CHANGELOG.md'),'utf8');
 const current=pkg.version.replace(/\./g,'\\.');
 assert.equal((log.match(new RegExp('^## v'+current+'\\b','gm'))||[]).length,1,
   'one changelog heading is required for the current release');
});
