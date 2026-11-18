// /scripts/patch-io-audit.cjs
'use strict';
const fs=require('node:fs'),path=require('node:path');
const repo=process.cwd(),file=path.join(repo,'src/cloud/server/index.cjs');
const marker='/* MILVAYO_IO_AUDIT_ONLY */';
const needle="service=require('./service.cjs').createService(getFirestore(app),getDatabase(app),metrics);";
const execute='result=await service.execute(actor.uid,req.body)';
const replacement=marker+"const audit=process.env.MILVAYO_IO_AUDIT==='1'?require('./ioAudit.cjs'):null,db=getFirestore(app),rtdb=getDatabase(app);if(audit)audit.instrument(db,rtdb);service=require('./service.cjs').createService(db,rtdb,metrics);";
const execReplace="result=await (process.env.MILVAYO_IO_AUDIT==='1'?require('./ioAudit.cjs').run(req.body?.action,()=>service.execute(actor.uid,req.body)):service.execute(actor.uid,req.body))";
const action=process.argv[2];if(!['install','remove','status'].includes(action)){console.error('Usage: node scripts/patch-io-audit.cjs install|remove|status');process.exit(2);}
let src=fs.readFileSync(file,'utf8');
if(action==='status'){console.log(src.includes(marker)?'temporary emulator meter installed':'temporary emulator meter not installed');process.exit(0);}
if(action==='install'){
 if(src.includes(marker)){console.log('Already installed');process.exit(0);}
 if(!src.includes(needle)||!src.includes(execute))throw Error('v0.8.10 index.cjs differs from the inspected source; do not patch blindly');
 src=src.replace(needle,replacement).replace(execute,execReplace);
 fs.writeFileSync(file,src);console.log('Temporary emulator meter installed. Do not commit this temporary index.cjs change.');
}else{
 if(!src.includes(marker)){console.log('Nothing to remove');process.exit(0);}
 if(!src.includes(replacement)||!src.includes(execReplace))throw Error('Instrumented index.cjs changed unexpectedly; refusing unsafe removal');
 src=src.replace(replacement,needle).replace(execReplace,execute);
 fs.writeFileSync(file,src);console.log('Temporary meter removed; index.cjs restored byte-for-byte.');
}
