// /src/screens/canvas/CanvasLibrary.js
import { useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { ActionMenu, Button, Card, EmptyState, Input, Page, ScreenIntro, Segmented, Sheet, T } from '../../ui/ui';
import { useStore } from '../../store/store';
import { useTheme } from '../../ui/theme/theme';
import { importBoardFile } from '../../canvas/importBoardFile';
const model=require('../../domain/model.cjs'),canvas=require('../../domain/canvas.cjs');
function template(board,kind,project,now){
 const make=(type,text,x=0,y=0,extra={})=>canvas.createObject({id:model.id('object'),boardId:board.id,type,text,x,y,now,...extra});
 let objects=[];
 if(kind==='brainstorm')objects=[make('frame','Ideas',0,0,{width:640,height:400}),make('note','What outcome matters?',32,64),make('note','What should we try?',312,64)];
 if(kind==='strategy')objects=[make('card','Goal',0,0),make('card','Options',280,0),make('card','Next decision',560,0)];
 if(kind==='risks')objects=project.governance.risks.map((risk,i)=>make('linked','',i%3*312,Math.floor(i/3)*224,{sourceLink:{sourceType:'risk',sourceId:risk.id,projectId:project.id,mode:'live'},width:280,height:200}));
 if(kind==='roadmap')objects=[make('linked','',0,0,{sourceLink:{sourceType:'roadmap',sourceId:project.id,projectId:project.id,mode:'live'},width:800,height:Math.max(240,Math.min(20000,80+project.tasks.filter(t=>t.start||t.due).length*44))})];
 if(kind==='roadmap'){const {roadmapScene}=require('../../canvas/roadmap.cjs'),{readSource}=require('../../canvas/sources.cjs');objects=objects.map(o=>{const layout=roadmapScene(readSource(project,o.sourceLink)),scale=Math.min(1,20000/layout.width,20000/layout.height);return {...o,width:layout.width*scale,height:layout.height*scale};});}
 if(kind==='brainstorm')objects=objects.map((o,i)=>i?{...o,groupId:objects[0].id}:o);
 return canvas.normalizeBoard({...board,objects},project.id);
}
export default function CanvasLibrary({go,openTask,openProject}){
 const {workspace,workspaceId,saveCanvas,flush,deleteCanvas}=useStore(),{c}=useTheme(),project=workspace.projects.find(p=>p.id===workspace.selectedId);
 const [selected,setSelected]=useState(''),[query,setQuery]=useState(''),[filter,setFilter]=useState('active'),[form,setForm]=useState(false),[title,setTitle]=useState(''),[kind,setKind]=useState('blank'),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const pendingCreate=useRef(null),[preview,setPreview]=useState('');
 const boards=useMemo(()=>(project.canvases||[]).filter(b=>(filter==='archived'?!!b.archivedAt:!b.archivedAt)&&`${b.title} ${project.name} Local device ${b.updatedAt}`.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)),[project,query,filter]);
 const commit=async(board,expected)=>{if(!saveCanvas(board,expected)){setError('Canvas could not be saved. Reopen the library and retry.');return false;}const ok=await flush();if(!ok)setError('Local save failed. Keep the app open, then retry.');return ok;};
 const create=async()=>{if(busy)return;setBusy(true);try{
  if(!pendingCreate.current){const now=model.iso(),board=template(canvas.createBoard({id:model.id('canvas'),projectId:project.id,title:title.trim(),now}),kind,project,now);if(!saveCanvas(board,null)){setError('Canvas could not be saved. Your draft is kept.');return;}pendingCreate.current=board.id;}
  if(await flush()){const id=pendingCreate.current;pendingCreate.current=null;setForm(false);setSelected(id);setError('');}else setError('Local save failed. Keep this screen open and retry Create canvas.');
 }catch(e){setError(e.message);}finally{setBusy(false);}};
 const duplicate=async board=>{try{const next=canvas.duplicateBoard(board,{id:model.id('canvas'),now:model.iso(),nextId:()=>model.id('item')});await commit(next,null);}catch(e){setError(e.message);return false;}};
 const importing=async()=>{try{const text=await importBoardFile();if(text===null)return;const board=canvas.importBoard(text,{id:model.id('canvas'),projectId:project.id,now:model.iso(),nextId:()=>model.id('item')});if(await commit(board,null))setSelected(board.id);}catch(e){setError(e.message);}};
 const current=(project.canvases||[]).find(b=>b.id===selected);
 if(current&&!current.archivedAt){const Editor=require('./CanvasEditor').default;return <Editor key={`${workspaceId}:${project.id}:${current.id}`} board={current} project={project} scope={JSON.stringify([workspaceId||'local',project.id])} onClose={()=>setSelected('')} go={go} openTask={openTask} openProject={openProject}/>;}
 return <Page>
  <ScreenIntro title="Canvas" description={`Visual planning for ${project.name}`}/>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}><Button label="New canvas" icon="plus" onPress={()=>{setTitle('');setForm(true);}}/><Button label="Import board" icon="upload" variant="secondary" onPress={importing}/></View>
  <Input value={query} onChangeText={setQuery} placeholder="Find a canvas" accessibilityLabel="Find a canvas"/>
  <Segmented options={[{value:'active',label:'Active'},{value:'archived',label:'Archived'}]} value={filter} onChange={setFilter}/>
  {error?<T color={c.danger} accessibilityRole="alert">{error}</T>:null}
  {boards.length?boards.map(board=><Card key={board.id} style={{gap:12}}>
   <View style={{flexDirection:'row',alignItems:'center',gap:8}}><View style={{flex:1,gap:4}}><T size={18} weight="600">{board.title}</T><T muted size={12}>Private on this device · {board.updatedAt.slice(0,10)}</T></View>
    <ActionMenu label={`Manage ${board.title}`} items={[
     {label:'Preview canvas',icon:'eye',onPress:()=>setPreview(board.id)},
     {label:'Duplicate canvas',icon:'copy',onPress:()=>duplicate(board)},
     {label:board.archivedAt?'Restore canvas':'Archive canvas',icon:'archive',onPress:()=>commit(canvas.changeBoard(board,{type:'archive',archived:!board.archivedAt},model.iso()),board.revision)},
     ...(board.archivedAt?[{label:'Delete archived canvas',icon:'trash-2',danger:true,confirmation:{title:'Delete archived canvas?',description:'A workspace recovery snapshot is kept before deletion. Export a board backup for a separate copy.',confirmLabel:'Delete canvas'},onPress:async()=>{if(!deleteCanvas(board.id,board.revision))return false;return await flush();}}]:[]),
    ]}/>
   </View><T muted size={13}>{board.objects.length} objects · {board.connectors.length} connections</T>
   {!board.archivedAt?<Button label={`Open ${board.title}`} variant="secondary" onPress={()=>setSelected(board.id)}/>:null}
  </Card>):<EmptyState title={filter==='archived'?'No archived canvases':'Plan in an open workspace'} description="Add notes, connect ideas, and bring in live project diagrams and tasks." action={<Button label="Create a canvas" icon="plus" onPress={()=>setForm(true)}/>}/>}
  <T muted size={12}>Boards are local and private. Sharing needs an authenticated Milvayo backend.</T>
  {preview?(()=>{const board=project.canvases.find(b=>b.id===preview);if(!board)return null;const Preview=require('./CanvasPreview').default;return <Sheet visible title={board.title} compact onClose={()=>setPreview('')}><Preview board={board}/></Sheet>;})():null}
  <Sheet visible={form} title="New canvas" compact onClose={()=>{if(!busy)setForm(false);}} footer={<Button label="Create canvas" disabled={busy||!title.trim()} onPress={create}/>}>
   {error?<T color={c.danger} accessibilityRole="alert">{error}</T>:null}
   <Input value={title} onChangeText={setTitle} placeholder="Canvas name" accessibilityLabel="Canvas name"/>
   <Segmented options={[{value:'blank',label:'Blank'},{value:'brainstorm',label:'Brainstorm'},{value:'strategy',label:'Strategy'},{value:'risks',label:'Risk workshop'},{value:'roadmap',label:'Roadmap'}]} value={kind} onChange={setKind}/>
  </Sheet>
 </Page>;
}
