// /src/cloud/tools/emulators.cjs
'use strict';
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const {PROJECT_ID,emulatorConfig}=require('../config.cjs');
const mode=process.argv[2]||'start';
if(!['start','test','export'].includes(mode))throw Error('Use start, test or export');
const args=mode==='export'?['emulators:export','.emulator-data/'+new Date().toISOString().replace(/[:.]/g,'-')]:['emulators:'+ (mode==='test'?'exec':'start'),'--only','auth,firestore,database,functions,storage,hosting','--non-interactive'];
const extra=process.argv.slice(3);for(let i=0;i<extra.length;i+=2){if(extra[i]==='--host'){const host=emulatorConfig(extra[i+1]).host,config=JSON.parse(fs.readFileSync('firebase.json','utf8'));for(const service of Object.values(config.emulators))if(service&&typeof service==='object')service.host=host;fs.writeFileSync('.firebase-emulator-local.json',JSON.stringify(config,null,2));args.push('--config','.firebase-emulator-local.json');}else if(extra[i]==='--import'&&mode==='start'&&extra[i+1])args.push('--import',extra[i+1]);else throw Error('Supported options: --host <private IPv4> and --import <emulator export>');}
args.push('--project',PROJECT_ID);if(mode==='test')args.push('node src/cloud/tools/runTests.cjs');
const child=spawn('firebase',args,{stdio:'inherit',env:{...process.env,GCLOUD_PROJECT:PROJECT_ID,FUNCTIONS_DISCOVERY_TIMEOUT:'60',JAVA_TOOL_OPTIONS:process.env.JAVA_TOOL_OPTIONS||'-Xms32m -Xmx192m -XX:ActiveProcessorCount=2'}});
child.on('error',e=>{console.error('Install Firebase CLI 15.34.2 or a compatible release:',e.message);process.exitCode=1;});child.on('exit',code=>{process.exitCode=code??1;});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
