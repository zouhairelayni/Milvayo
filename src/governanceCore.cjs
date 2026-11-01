'use strict';
const safeText=(x,n=6000)=>typeof x==='string'?x.slice(0,n):'';
const finite=(x)=>Number.isFinite(Number(x))?Number(x):0;
function normalizeGovernance(raw){
 const r=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 // A bounded plain-JSON extension. No dates, functions, or screen state are copied into persistence.
 const info=r.info&&typeof r.info==='object'&&!Array.isArray(r.info)?r.info:{};
 const health=['On track','At risk','Off track'].includes(info.health)?info.health:'On track';
 const phase=['Initiating','Planning','Executing','Monitoring and controlling','Closing'].includes(info.phase)?info.phase:'Initiating';
 const budget=r.budget&&typeof r.budget==='object'&&!Array.isArray(r.budget)?r.budget:{};
 const capped=a=>Array.isArray(a)?a.slice(0,500):[];
 const wbs=capped(r.wbs).map(x=>({id:safeText(x?.id,100),parent:x?.parent===null?null:safeText(x?.parent,100),name:safeText(x?.name,300),owner:safeText(x?.owner,120),hours:Math.max(0,finite(x?.hours)),note:safeText(x?.note,2000)})).filter(x=>x.id);
 if(!wbs.some(x=>x.id==='w0'))wbs.unshift({id:'w0',parent:null,name:'',owner:'',hours:0,note:''});
 const risks=capped(r.risks).map(x=>({id:safeText(x?.id,120),title:safeText(x?.title,300),category:safeText(x?.category,80),type:x?.type==='Opportunity'?'Opportunity':'Threat',prob:Math.max(1,Math.min(5,Math.round(finite(x?.prob)||1))),impact:Math.max(1,Math.min(5,Math.round(finite(x?.impact)||1))),strategy:safeText(x?.strategy,80),response:safeText(x?.response,2000),owner:safeText(x?.owner,150),status:safeText(x?.status,80)||'Open'}));
 const lines=capped(budget.lines).map(x=>({id:safeText(x?.id,120),category:safeText(x?.category,150),planned:Math.max(0,finite(x?.planned)),committed:Math.max(0,finite(x?.committed)),actual:Math.max(0,finite(x?.actual))}));
 const docs={};for(const [k,v] of Object.entries(r.docs||{}).slice(0,30)){
   if(!/^[a-zA-Z]{1,40}$/.test(k)||!v||typeof v!=='object')continue;
   const values={};for(const [field,entry] of Object.entries(v.values||{}).slice(0,80)){
     if(!/^[a-zA-Z]{1,50}$/.test(field))continue;
     const value=JSON.stringify(entry);if(value&&value.length<=50000){try{values[field]=JSON.parse(value)}catch{}}
   }
   docs[k]={status:['Not started','Draft','In review','Approved'].includes(v.status)?v.status:'Not started',values};
 }
 return {info:{code:safeText(info.code,100),sponsor:safeText(info.sponsor,150),manager:safeText(info.manager,150),customer:safeText(info.customer,150),phase,health,objective:safeText(info.objective,3000),start:safeText(info.start,10),end:safeText(info.end,10)},budget:{contingencyPct:Math.max(0,Math.min(100,finite(budget.contingencyPct??10))),lines},risks,wbs,docs};
}
module.exports={normalizeGovernance};
