// /src/cloud/journalStorage.cjs
'use strict';
const {sha256}=require('js-sha256');
const CHUNK=100000,MAX_PARTS=10000;
// Row boundaries keep an append from copying every earlier queue chunk.
function fragments(value,serialize=JSON.stringify){
 const parts=['{'];let first=true;
 const split=text=>{for(let n=0;n<text.length;){let end=Math.min(text.length,n+CHUNK);if(end<text.length&&/[\uD800-\uDBFF]/.test(text[end-1]))end--;parts.push(text.slice(n,end));n=end;}};
 for(const [key,item] of Object.entries(value)){
  parts.push((first?'':',')+JSON.stringify(key)+':');first=false;
  if(!Array.isArray(item)){split(JSON.stringify(item));continue;}
  parts.push('[');let chunk='',rows=0;
  for(let i=0;i<item.length;i++){const row=(i?',':'')+serialize(item[i]);if(chunk&&(rows>=32||chunk.length+row.length>CHUNK)){split(chunk);chunk='';rows=0;}chunk+=row;rows++;if(chunk.length>=CHUNK){split(chunk);chunk='';rows=0;}}
  if(chunk)split(chunk);parts.push(']');
 }
 parts.push('}');return parts;
}
function createJournalStorage(storage,key,newId){
 let pointer=null,known=new Set(),cachedParts=new Map();const serialized=new WeakMap();
 // Journal queue entries are deeply frozen before persistence; mutable caller data is never cached.
 const serialize=value=>{if(!value||typeof value!=='object'||!Object.isFrozen(value))return JSON.stringify(value);let text=serialized.get(value);if(text===undefined){text=JSON.stringify(value);serialized.set(value,text);}return text;};
 const refs=p=>Array.isArray(p)?p:p?.parts||[];
 function manifest(p){const validParts=parts=>Array.isArray(parts)&&parts.length<=MAX_PARTS&&parts.every(k=>typeof k==='string'&&k.startsWith(key+':part:'));if(!['milvayo.cloud.journal.v1','milvayo.cloud.journal.v2'].includes(p?.format)||!validParts(p.parts)||typeof p.checksum!=='string'||p.previous&&!validParts(refs(p.previous)))throw Error('Invalid cloud journal manifest');return p;}
 async function read(){const raw=await storage.getItem(key);if(!raw)return null;const p=JSON.parse(raw);if(p.schema===1)return p;manifest(p);
  let text='';for(const part of p.parts){const value=await storage.getItem(part);if(value===null)throw Error('Cloud journal part is missing; keep local backups');if(p.format==='milvayo.cloud.journal.v2'&&key+':part:'+sha256(value)!==part)throw Error('Cloud journal checksum mismatch; keep local backups');text+=value;}
  if((p.format==='milvayo.cloud.journal.v2'?sha256(p.parts.join('\n')):sha256(text))!==p.checksum)throw Error('Cloud journal checksum mismatch; keep local backups');const value=JSON.parse(text);pointer=p;known=new Set(p.parts);return value;
 }
 async function write(value){const chunks=fragments(value,serialize),parts=[],nextCached=new Map();let length=0;
  if(chunks.length>MAX_PARTS)throw Error('Cloud recovery journal is full; export before continuing');
  for(const text of chunks){length+=text.length;if(length>CHUNK*2000)throw Error('Cloud recovery journal is full; export before continuing');const part=cachedParts.get(text)||key+':part:'+sha256(text);nextCached.set(text,part);if(!known.has(part)){await storage.setItem(part,text);known.add(part);}parts.push(part);}
  const previous=pointer?{format:pointer.format,parts:pointer.parts,checksum:pointer.checksum}:null;
  const next={format:'milvayo.cloud.journal.v2',parts,checksum:sha256(parts.join('\n')),previous};await storage.setItem(key,JSON.stringify(next));
  const garbage=refs(pointer?.previous),keep=new Set([...parts,...refs(previous)]);pointer=next;cachedParts=nextCached;
  if(storage.removeItem)for(const old of new Set(garbage))if(!keep.has(old))try{await storage.removeItem(old);known.delete(old);}catch{}
 }
 return {read,write};
}
module.exports={CHUNK,createJournalStorage};
