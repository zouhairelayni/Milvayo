// /src/cloud/changeFeed.cjs
'use strict';
// Client side of the v4 change feed (server: src/cloud/server/feed.cjs). Pure: it only calls `request` and returns the new feed state and the records to apply, so a failed round changes nothing.
//  - `directoryV4` lists the readable projects and the workspace-level records; `pullV4` returns one project's changes since a cursor, page by page.
//  - A first sync (no state) reads every project once. Later rounds ask only for the projects named in `only` (the ones whose change signal moved) unless a directory refresh is wanted.
//  - Any reset (access changed, cursor expired) throws the state away and reads everything again, once; a second reset in a row is an error.
// The journal compares records by `sequence`; the per-record `revision` is monotonic, so every record is returned with sequence = revision.
const PAGE=200,PARALLEL=3;
const withSequence=r=>({...r,sequence:r.revision});
const unsupported=()=>Object.assign(Error('This workspace does not use the v4 change feed'),{code:'failed-precondition'});
function createChangeFeed({request}){
 const defined=o=>Object.fromEntries(Object.entries(o).filter(([,v])=>v!==undefined));
 async function pullProject(projectId,{cursor,accessVersion}){
  const records=[];let page,round,last,requests=0;
  do{last=await request(defined({action:'pullV4',projectId,limit:PAGE,cursor,page,roundStartedAt:round,accessVersion}));requests++;
   if(last.reset)return {reset:last.reset,requests};
   records.push(...last.records);page=last.page??undefined;round=last.roundStartedAt;
  }while(last.more);
  return {records,cursor:last.cursor,requests};
 }
 // prev: the stored feed state ({accessVersion, cursors, projects, shared}) or null. options: {only: Set of project IDs, dir: an already fetched directory, directory: false to skip the directory call}
 async function sync(prev,options={}){
  let state=prev&&prev.accessVersion&&prev.cursors?prev:null,requests=0;
  for(let attempt=0;attempt<2;attempt++){
   const full=!state;let dir=attempt===0?options.dir||null:null;
   if(!dir&&(full||options.directory!==false)){dir=await request({action:'directoryV4'});requests++;}
   if(dir&&dir.protocol!==4)throw unsupported();
   if(state&&dir&&dir.accessVersion!==state.accessVersion){state=null;continue;}
   const known=state?state.projects:[],ids=dir?dir.projects.map(r=>r.projectId):known,dropped=dir?known.filter(id=>!ids.includes(id)):[];
   const targets=(!full&&options.only)?ids.filter(id=>options.only.has(id)):ids,accessVersion=state?state.accessVersion:dir.accessVersion;
   const cursors={...(state?state.cursors:{})};for(const id of dropped)delete cursors[id];
   const results=[];let restart=false;
   for(let i=0;i<targets.length&&!restart;i+=PARALLEL){
    const group=targets.slice(i,i+PARALLEL),pulled=await Promise.all(group.map(id=>pullProject(id,{cursor:cursors[id],accessVersion:full?undefined:accessVersion})));
    pulled.forEach((r,n)=>{requests+=r.requests;if(r.reset)restart=true;else results.push([group[n],r]);});
   }
   if(restart){state=null;continue;}
   const records=[],sharedRevisions={...(state?state.shared:{})};
   for(const [id,r] of results){cursors[id]=r.cursor;records.push(...r.records.map(withSequence));}
   // Workspace-level records (portfolios, programs) have no feed; they come with the directory and are sent on only when their revision moved.
   if(dir)for(const r of dir.shared){if(sharedRevisions[r.key]!==r.revision){sharedRevisions[r.key]=r.revision;records.push(withSequence(r));}}
   return {protocol:4,reset:full&&!!prev,records,dropped,requests,grant:dir?.grant,membershipRole:dir?.membershipRole,accessVersion,feed:{accessVersion,cursors,projects:ids,shared:sharedRevisions},pulled:targets};
  }
  throw Object.assign(Error('The change feed was reset twice in a row; try again'),{code:'aborted'});
 }
 return {sync,directory:()=>request({action:'directoryV4'}),pullProject};
}
module.exports={createChangeFeed,withSequence,PAGE};
