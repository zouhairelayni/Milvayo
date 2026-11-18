// /tests/helpers/scan-firebase-usage.cjs
'use strict';
// Static *candidate* inventory across Milvayo src and scripts; not execution or billable usage.
const fs=require('node:fs'),path=require('node:path');
const out=process.argv[2]||process.env.HOME||process.cwd();fs.mkdirSync(out,{recursive:true});
const roots=['src','scripts','functions'].filter(fs.existsSync);const files=[];
function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){if(['node_modules','dist','build','.expo','.git','coverage'].includes(item.name))continue;const full=path.join(dir,item.name);if(item.isDirectory())walk(full);else if(/\.(?:cjs|mjs|js|jsx|ts|tsx)$/.test(item.name))files.push(full);}}
roots.forEach(walk);
const patterns={
 'Cloud API request':/\b(?:request|callCloud|cloudApi)\s*\(/g,
 'Firestore client SDK import':/\bfrom\s*['"]firebase\/firestore['"]|\brequire\s*\(\s*['"]firebase\/firestore['"]/g,
 'Firestore Admin SDK import':/\brequire\s*\(\s*['"]firebase-admin\/firestore['"]/g,
 'RTDB client SDK import':/\bfrom\s*['"]firebase\/database['"]|\brequire\s*\(\s*['"]firebase\/database['"]/g,
 'RTDB Admin SDK import':/\brequire\s*\(\s*['"]firebase-admin\/database['"]/g,
 'Storage SDK import':/\bfrom\s*['"]firebase\/storage['"]|\brequire\s*\(\s*['"]firebase\/storage['"]/g,
 'Auth SDK import':/\bfrom\s*['"]firebase\/auth['"]|\brequire\s*\(\s*['"]firebase\/auth['"]/g,
 'RTDB presence/listener write or read':/\b(?:onValue|onChildAdded|onDisconnect|serverTimestamp)\s*\(/g,
 'Firestore listener/query/write':/\b(?:onSnapshot|getDocs|getDoc|setDoc|updateDoc|deleteDoc|writeBatch|runTransaction)\s*\(/g,
 'Storage upload/download':/\b(?:uploadBytes|uploadString|getDownloadURL|deleteObject|listAll)\s*\(/g,
};
const rows=[];
for(const file of files){const lines=fs.readFileSync(file,'utf8').split(/\r?\n/);lines.forEach((line,i)=>{for(const [category,re]of Object.entries(patterns)){re.lastIndex=0;if(re.test(line))rows.push({file,line:i+1,category,excerpt:line.trim().slice(0,210)});}});}
const result={createdAt:new Date().toISOString(),sourceFilesScanned:files.length,candidates:rows.length,notice:'Static candidates only: these are NOT emulator-measured costs; investigate each client-side Firebase path and client listener separately. Dispatch coverage in milvayo-v4-io-audit.json does not include these.',items:rows};
const base=path.join(out,'milvayo-v4-client-io-inventory');fs.writeFileSync(base+'.json',JSON.stringify(result,null,2));
fs.writeFileSync(base+'.md',['# Milvayo Firebase client/auxiliary SDK inventory','','Static candidates; **not emulator-measured**. Calls may be duplicates, indirect, or unrelated; verify actual runtime use.','','Files scanned: '+files.length+', matches: '+rows.length,'','| File | Line | Candidate |','| --- | ---: | --- |',...rows.map(r=>`| ${r.file} | ${r.line} | ${r.category} |`),''].join('\n'));
console.log('Firebase client/auxiliary candidates:',rows.length,'across',files.length,'source files. Output:',base+'.json');
