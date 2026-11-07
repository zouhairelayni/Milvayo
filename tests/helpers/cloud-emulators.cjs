// /tests/helpers/cloud-emulators.cjs
'use strict';
const crypto=require('node:crypto'),fs=require('node:fs');
const {PROJECT_ID}=require('../../src/cloud/config.cjs');
const S=require('../../src/cloud/schema.cjs'),m=require('../../src/domain/model.cjs');
async function account(prefix='test'){
 const email=`${prefix}-${crypto.randomUUID()}@milvayo.test`,password='Local-test-only-583';
 const r=await fetch(`http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=milvayo-emulator-only`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true})});const data=await r.json();if(!r.ok)throw Error(JSON.stringify(data));return {uid:data.localId,token:data.idToken,email,password};
}
async function request(user,body){const r=await fetch(`http://127.0.0.1:5001/${PROJECT_ID}/us-central1/cloudApi`,{method:'POST',headers:{'Content-Type':'application/json',...(user?{Authorization:'Bearer '+user.token}:{})},body:JSON.stringify(body),signal:AbortSignal.timeout(90000)});const data=await r.json();if(!r.ok)throw Object.assign(Error(data.error||JSON.stringify(data)),{code:data.code,status:r.status});return data;}
async function publish(user,workspace=m.normalizeWorkspace(m.createWorkspace()),workspaceId='main'){
 const scope=await request(user,{action:'bootstrap',workspaceId});const records=S.pack(workspace).sort((a,b)=>(a.key<b.key?-1:a.key>b.key?1:0));const sourceHash=crypto.createHash('sha256').update(S.stable(records)).digest('hex');await request(user,{...scope,action:'importBegin',sourceHash});for(let i=0;i<records.length;i+=50)await request(user,{...scope,action:'importChunk',sourceHash,records:records.slice(i,i+50)});await request(user,{...scope,action:'importFinalize',sourceHash});return {...scope,records,sourceHash,workspace};
}
async function environment(){const {initializeTestEnvironment}=require('@firebase/rules-unit-testing');return initializeTestEnvironment({projectId:PROJECT_ID,firestore:{host:'127.0.0.1',port:8080,rules:fs.readFileSync('firestore.rules','utf8')},database:{host:'127.0.0.1',port:9000},storage:{host:'127.0.0.1',port:9199,rules:fs.readFileSync('storage.rules','utf8')}});}
const database=context=>context.database(`http://127.0.0.1:9000/?ns=${PROJECT_ID}-default-rtdb`);
module.exports={account,request,publish,environment,database};
