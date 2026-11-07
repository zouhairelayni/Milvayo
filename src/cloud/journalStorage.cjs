// /src/cloud/journalStorage.cjs
'use strict';
const {sha256}=require('js-sha256');
const CHUNK=100000;
function createJournalStorage(storage,key,newId){
 let pointer=null;
 async function read(){const raw=await storage.getItem(key);if(!raw)return null;const p=JSON.parse(raw);if(p.schema===1)return p;
  if(p.format!=='milvayo.cloud.journal.v1'||!Array.isArray(p.parts)||p.parts.length>2000||p.parts.some(k=>typeof k!=='string'||!k.startsWith(key+':part:')))throw Error('Invalid cloud journal manifest');
  let text='';for(const part of p.parts){const value=await storage.getItem(part);if(value===null)throw Error('Cloud journal part is missing; keep local backups');text+=value;}
  if(sha256(text)!==p.checksum)throw Error('Cloud journal checksum mismatch; keep local backups');pointer=p;return JSON.parse(text);
 }
 async function write(value){const text=JSON.stringify(value),generation=newId(),parts=[];if(text.length>CHUNK*2000)throw Error('Cloud recovery journal is full; export before continuing');
  for(let n=0;n<text.length;){let end=Math.min(text.length,n+CHUNK);if(end<text.length&&/[\uD800-\uDBFF]/.test(text[end-1]))end--;if(parts.length>=2000)throw Error('Cloud recovery journal is full');const part=key+':part:'+generation+':'+parts.length;await storage.setItem(part,text.slice(n,end));parts.push(part);n=end;}
  const next={format:'milvayo.cloud.journal.v1',parts,checksum:sha256(text),previous:pointer?.parts||[]};await storage.setItem(key,JSON.stringify(next));const garbage=pointer?.previous||[];pointer=next;
  if(storage.removeItem)for(const old of garbage)await storage.removeItem(old).catch(()=>{});
 }
 return {read,write};
}
module.exports={CHUNK,createJournalStorage};
