#!/usr/bin/env node
// /scripts/deploy-hosting.cjs
'use strict';
const {spawnSync}=require('node:child_process');
const project=process.env.MILVAYO_FIREBASE_PROJECT_ID;
if(!project||!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(project)){
 console.error('Set MILVAYO_FIREBASE_PROJECT_ID to the NEW, separate Milvayo Firebase project ID before deployment.');
 process.exit(1);
}
if(/rivna|control.?center/i.test(project)){
 console.error('Deployment blocked: this project ID appears to belong to another Niyarvo/RIVNA product.');
 process.exit(1);
}
const run=(cmd,args)=>{
 const r=spawnSync(cmd,args,{stdio:'inherit',shell:process.platform==='win32'});
 if(r.error){console.error(r.error.message);process.exit(1)}
 if(r.status!==0)process.exit(r.status||1);
};
console.log(`Building Milvayo Web for Firebase project: ${project}`);
run('npm',['run','build:web']);
run('firebase',['deploy','--only','hosting','--project',project]);
