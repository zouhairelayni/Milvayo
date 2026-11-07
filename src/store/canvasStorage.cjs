// /src/store/canvasStorage.cjs
'use strict';
const canvas=require('../domain/canvas.cjs');
const {tooBig}=require('./importFiles.cjs');
const {fitBackups}=require('./backupBudget.cjs');
const LIVE_CANVAS_BUDGET=1.4*1024*1024;
function saveCanvas(workspace,board,expectedRevision){
 const project=workspace.projects.find(p=>p.id===workspace.selectedId);if(!project)throw Error('Project missing');
 const next=canvas.saveBoard(project,board,expectedRevision),result={...workspace,projects:workspace.projects.map(p=>p.id===project.id?next:p)};
 // Existing Android storage is a single row; leave room for activity and recovery metadata.
 if(tooBig(JSON.stringify({...result,backups:[]}),LIVE_CANVAS_BUDGET))throw Error('Canvas needs more storage space. Export and split boards or projects; no data changed.');
 return result;
}
function deleteCanvas(workspace,id,revision,snapshot){
 const project=workspace.projects.find(p=>p.id===workspace.selectedId),next=canvas.deleteBoard(project,id,revision);
 const candidate={...workspace,projects:workspace.projects.map(p=>p.id===project.id?next:p),backups:[snapshot,...workspace.backups].slice(0,12)},result=fitBackups(candidate).workspace;
 if(!result.backups.some(s=>s.id===snapshot.id))throw Error('There is not enough space for recovery. Keep this canvas archived and export a board backup.');
 return result;
}
module.exports={LIVE_CANVAS_BUDGET,saveCanvas,deleteCanvas};
