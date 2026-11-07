// /src/cloud/tools/fixtures.cjs
'use strict';
const model=require('../../domain/model.cjs'),canvas=require('../../domain/canvas.cjs');
function generate({tasks=100,objects=25,projects=1,seed=83}={}){
 if(!Number.isInteger(tasks)||tasks<0||tasks>10000||objects<0||objects>1000||projects<1||projects>30)throw Error('Fixture exceeds existing domain limits');
 const now='2026-11-07T00:00:00.000Z',result=[];
 for(let p=0;p<projects;p++){
  const projectId=`synthetic-${seed}-${p}`,board=canvas.createBoard({id:`canvas-${seed}-${p}`,projectId,title:'Synthetic planning',now});
  const rows=Array.from({length:objects},(_,i)=>canvas.createObject({id:`object-${i}`,boardId:board.id,type:'note',x:(i%25)*280,y:Math.floor(i/25)*180,text:'Planning note '+i,now}));
  result.push(model.makeProject({id:projectId,name:'Synthetic project '+p,importedAt:now,tasks:Array.from({length:tasks},(_,i)=>({id:`task-${i}`,title:'Synthetic task '+i,status:['Backlog','In progress','Validation','Done'][(i+seed)%4],owner:'Synthetic contributor',createdAt:now,updatedAt:now,position:i})),canvases:[{...board,objects:rows}]}));
 }
 return model.normalizeWorkspace({schemaVersion:1,projects:result,selectedId:result[0].id,activity:[],backups:[],revision:1});
}
module.exports={generate};
