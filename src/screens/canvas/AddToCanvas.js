// /src/screens/canvas/AddToCanvas.js
import { useRef, useState } from 'react';
import { View } from 'react-native';
import { Button, Input, Sheet, T } from '../../ui/ui';
import { useStore } from '../../store/store';
const model=require('../../domain/model.cjs'),canvas=require('../../domain/canvas.cjs');
const {readSource}=require('../../canvas/sources.cjs');
export default function AddToCanvas({source}){
 const {workspace,saveCanvas,flush}=useStore(),project=workspace.projects.find(p=>p.id===workspace.selectedId);
 const [open,setOpen]=useState(false),[title,setTitle]=useState('Project canvas'),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const running=useRef(false),pendingPlacement=useRef(null);
 const link={...source,sourceId:source.sourceId||(['roadmap','project'].includes(source.sourceType)?project.id:''),projectId:project.id,mode:'live'};
 const place=async board=>{
  if(running.current)return;running.current=true;setBusy(true);setMessage('');
  try{
   if(pendingPlacement.current){if(!await flush())throw Error('Local save failed. Keep this picker open and retry.');setMessage(`Added to ${pendingPlacement.current.title}`);pendingPlacement.current=null;return;}
   const data=readSource(project,link);if(!data.available)throw Error('This source is unavailable');
   const now=model.iso(),isNew=!board;
   let target=board||canvas.createBoard({id:model.id('canvas'),projectId:project.id,title:title.trim(),now});
   let object=canvas.createObject({id:model.id('object'),boardId:target.id,type:'linked',sourceLink:link,x:target.objects.length?Math.max(...target.objects.map(o=>o.x+o.width))+32:0,y:0,now,...(data.kind==='diagram'?{width:800,height:480}:data.kind==='roadmap'?{width:800,height:Math.max(240,Math.min(20000,80+data.tasks.length*44))}:{width:280,height:200})});
   if(data.kind==='diagram'){const {objectScene}=require('../../canvas/scene'),layout=objectScene(object,project,JSON.stringify(['add-to-canvas',project.id])).scene,factor=Math.min(1,20000/layout.width,20000/layout.height);object={...object,width:Math.max(40,layout.width*factor),height:Math.max(32,layout.height*factor)};}
   if(isNew){target=canvas.normalizeBoard({...target,objects:[object]},project.id);if(!saveCanvas(target,null))throw Error('Canvas could not be saved');}
   else{const next=canvas.changeBoard(target,{type:'add',objects:[object]},now);if(!saveCanvas(next,target.revision))throw Error('Canvas changed; reopen the picker and retry');}
   pendingPlacement.current={id:target.id,title:target.title};if(!await flush())throw Error('Local save failed. Keep this picker open and retry.');pendingPlacement.current=null;setMessage(`Added to ${target.title}`);
  }catch(error){setMessage(error.message);}finally{running.current=false;setBusy(false);}
 };
 return <>
  <Button label="Add to Canvas" icon="edit-3" variant="ghost" onPress={()=>{setMessage('');setOpen(true);}}/>
  <Sheet visible={open} title="Add to Canvas" compact onClose={()=>{if(!busy)setOpen(false);}}>
   <T muted size={13}>Place a live link from {project.name}. Moving it changes only its Canvas position.</T>
   {(project.canvases||[]).filter(b=>!b.archivedAt).map(board=><Button key={board.id} label={board.title} variant="secondary" disabled={busy} onPress={()=>place(board)}/>)}
   <View style={{gap:8}}><Input value={title} onChangeText={setTitle} accessibilityLabel="New canvas title"/><Button label="Create canvas and add" disabled={busy||!title.trim()} onPress={()=>place(null)}/></View>
   {message?<T accessibilityLiveRegion="polite">{message}</T>:null}
  </Sheet>
 </>;
}
