// /src/cloud/config.cjs
'use strict';
const PROJECT_ID = 'demo-milvayo-083';
const PORTS = Object.freeze({auth:9099,firestore:8080,database:9000,functions:5001,storage:9199,hosting:5000,hub:4400});
function emulatorConfig(host='127.0.0.1', projectId=PROJECT_ID) {
 if(projectId!==PROJECT_ID)throw Error('Only the Milvayo demo emulator project is allowed');
 if(typeof host!=='string'||!(/^(localhost|127\.0\.0\.1|10\.(\d{1,3}\.){2}\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})$/).test(host))throw Error('Use localhost or a private LAN IPv4 emulator host');
 if(host.split('.').some(x=>/^\d+$/.test(x)&&Number(x)>255))throw Error('Invalid emulator host');
 return {projectId,host,ports:PORTS,apiKey:'milvayo-emulator-only',appId:'milvayo-emulator-only',databaseURL:`http://${host}:${PORTS.database}?ns=${PROJECT_ID}-default-rtdb`,storageBucket:`${PROJECT_ID}.appspot.com`};
}
function assertServerEnvironment(env=process.env) {
 if(env.GCLOUD_PROJECT!==PROJECT_ID||env.FUNCTIONS_EMULATOR!=='true')throw Error('Cloud server is restricted to the local Milvayo emulator');
 for(const name of ['FIRESTORE_EMULATOR_HOST','FIREBASE_AUTH_EMULATOR_HOST','FIREBASE_DATABASE_EMULATOR_HOST','FIREBASE_STORAGE_EMULATOR_HOST']){
  const value=env[name];if(!value||!/^127\.0\.0\.1:\d+$|^localhost:\d+$/.test(value))throw Error(`Missing local emulator: ${name}`);
 }
 return PROJECT_ID;
}
module.exports={PROJECT_ID,PORTS,emulatorConfig,assertServerEnvironment};
