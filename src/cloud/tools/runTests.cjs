// /src/cloud/tools/runTests.cjs
'use strict';
const {spawnSync}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path');
const {PROJECT_ID}=require('../config.cjs');
const files=fs.readdirSync('tests/cloud').filter(f=>f.endsWith('.test.cjs')).map(f=>path.join('tests/cloud',f));
const result=spawnSync(process.execPath,['--test','--test-concurrency=1',...files],{stdio:'inherit',env:{...process.env,MILVAYO_EMULATORS:'1',GCLOUD_PROJECT:PROJECT_ID,FIRESTORE_EMULATOR_HOST:'127.0.0.1:8080',FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:9099',FIREBASE_DATABASE_EMULATOR_HOST:'127.0.0.1:9000',FIREBASE_STORAGE_EMULATOR_HOST:'127.0.0.1:9199'}});process.exitCode=result.status??1;
