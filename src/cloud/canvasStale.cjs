// /src/cloud/canvasStale.cjs
'use strict';
// Stops an open Canvas screen from overwriting the other person's work (0.8.34, audit finding F12).
// The Canvas screen keeps its own copy of the board and saves "that copy plus my edit", checking only the board's revision.
// In a cloud workspace the revision is local bookkeeping and used to stay the same when the OTHER person's objects arrived,
// so an out-of-date screen passed the check and its save erased or reverted the newer work.
// Now: whenever received changes alter the content of a board (objects, connectors, comment threads), the board's local revision goes up by one.
// A screen holding the old copy is then refused by the normal revision check, and the open Canvas can pick up the new copy (see CanvasEditor.js).
const S=require('./schema.cjs');
// The server stamps its own update time on objects, so my own change coming back differs only in `updatedAt`. That is not a change by someone else and must not raise the revision.
const bare=list=>(list||[]).map(({updatedAt,...rest})=>rest);
const content=b=>S.stable({objects:bare(b.objects),connectors:bare(b.connectors),threads:bare(b.threads)});
// `current` = workspace on this device, `next` = workspace after the received changes (frozen, from S.unpack). Returns `next` itself when nothing changed, otherwise a copy where the changed boards carry the higher revision.
function markChangedBoards(current,next){
 let marked=0;
 const projects=(next.projects||[]).map(p=>{
  const old=(current.projects||[]).find(x=>x.id===p.id);if(!old)return p;
  let touched=false;
  const canvases=(p.canvases||[]).map(b=>{
   const was=(old.canvases||[]).find(x=>x.id===b.id);if(!was)return b;
   if(content(was)!==content(b)){touched=true;marked++;return {...b,revision:Math.max(was.revision||0,b.revision||0)+1};}
   if((was.revision||0)>(b.revision||0)){touched=true;return {...b,revision:was.revision};}
   return b;
  });
  return touched?{...p,canvases}:p;
 });
 return marked||projects.some((p,i)=>p!==next.projects[i])?{...next,projects}:next;
}
module.exports={markChangedBoards,content};
