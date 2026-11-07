// /src/cloud/tools/seed.cjs
'use strict';
const {PROJECT_ID,assertServerEnvironment}=require('../config.cjs');
Object.assign(process.env,{GCLOUD_PROJECT:PROJECT_ID,FUNCTIONS_EMULATOR:'true',FIRESTORE_EMULATOR_HOST:'127.0.0.1:8080',FIREBASE_AUTH_EMULATOR_HOST:'127.0.0.1:9099',FIREBASE_DATABASE_EMULATOR_HOST:'127.0.0.1:9000',FIREBASE_STORAGE_EMULATOR_HOST:'127.0.0.1:9199'});assertServerEnvironment();
const S=require('../schema.cjs'),crypto=require('node:crypto'),{generate}=require('./fixtures.cjs');
async function run(){
 const {initializeApp}=require('firebase-admin/app'),{getFirestore}=require('firebase-admin/firestore');const app=initializeApp({projectId:PROJECT_ID,credential:{getAccessToken:async()=>({access_token:'owner',expires_in:3600})}}),db=getFirestore(app);
 const email='owner@milvayo.test',password='Milvayo-local-only-083';
 const authRequest=async(method)=>{const response=await fetch(`http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:${method}?key=milvayo-emulator-only`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:true}),signal:AbortSignal.timeout(10000)});return response.json();};
 let user=await authRequest('signUp');if(user.error?.message==='EMAIL_EXISTS')user=await authRequest('signInWithPassword');if(!user.idToken)throw Error(user.error?.message||'Emulator sign-in failed');
 const request=async body=>{const response=await fetch(`http://127.0.0.1:5001/${PROJECT_ID}/us-central1/cloudApi`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+user.idToken},body:JSON.stringify(body),signal:AbortSignal.timeout(45000)});const value=await response.json();if(!response.ok)throw Error(value.error);return value;};
 const scope=await request({action:'bootstrap',workspaceId:'synthetic'}),records=S.pack(generate()).sort((a,b)=>(a.key<b.key?-1:a.key>b.key?1:0)),sourceHash=crypto.createHash('sha256').update(S.stable(records)).digest('hex');const begin=await request({...scope,action:'importBegin',sourceHash});if(begin.state!=='active'){for(let i=0;i<records.length;i+=50)await request({...scope,action:'importChunk',sourceHash,records:records.slice(i,i+50)});await request({...scope,action:'importFinalize',sourceHash});}
 // This explicit seed command establishes a local platform operator, never a live claim.
 await db.doc('platformRoles/'+user.localId).set({role:'owner',source:'local synthetic seed'});
 console.log(JSON.stringify({projectId:PROJECT_ID,...scope,email,password,uid:user.localId,synthetic:true},null,2));
 await app.delete();
}
run().catch(e=>{console.error(e.message);process.exitCode=1;});
