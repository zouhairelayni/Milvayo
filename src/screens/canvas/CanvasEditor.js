// /src/screens/canvas/CanvasEditor.js
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import { Button, Input, Segmented, T } from '../../ui/ui';
import { useTheme } from '../../ui/theme/theme';
import { useStore } from '../../store/store';
import { useBackDismiss } from '../../app/navigation/useBackNavigation';
import { useRenderMetric } from '../../diagnostics/useRenderMetric';
import { diagnosticMonitor } from '../../diagnostics/monitor';
import {useCloudPresence} from '../../cloud/useCloudPresence';
import { wbsDelete } from '../../governance/pm';
import CanvasSurface from '../../canvas/CanvasSurface';
import CanvasExports from './CanvasExports';
import CanvasToolbar, {CanvasTool} from './CanvasToolbar';
import CanvasHeader from './CanvasHeader';
import CanvasCommentBubble from './CanvasCommentBubble';
import CanvasSvgButton from './CanvasSvgButton';
import CanvasPanButtons from './CanvasPanButtons';
import CanvasPopover,{CanvasPopoverHost} from './CanvasPopover';
import CanvasBrushPalette from './CanvasBrushPalette';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useCanvasCamera} from '../../canvas/useCanvasCamera';
import CanvasContextToolbar from './CanvasContextToolbar';
import CanvasAddMenu from './CanvasAddMenu';
import CanvasSwatches from './CanvasSwatches';
import CanvasSources from './CanvasSources';
import CanvasItemList from './CanvasItemList';
import CanvasInlineEditor from './CanvasInlineEditor';
import CanvasMenuRow from './CanvasMenuRow';
import { useHeaderActions } from '../../components/shell/HeaderActions';
import { objectScene } from '../../canvas/scene';
const model=require('../../domain/model.cjs'),canvas=require('../../domain/canvas.cjs');
const {sourceOptions,readSource,captureSource}=require('../../canvas/sources.cjs');
const {fitPose,zoomAt,worldPoint,objectBounds,movingIds}=require('../../canvas/interaction.cjs');
const {pushHistory}=require('../../canvas/history.cjs');
const {erasedStrokeIds}=require('../../canvas/drawing.cjs');
const {localEditTarget}=require('../../canvas/localEditing.cjs');
const {selectObject,changeTool,readablePose}=require('../../canvas/editorTools.cjs');
const {commentGeometry,commentPosition}=require('../../canvas/comments.cjs');
const {randomLineColor,LINE_PALETTE}=require('../../canvas/connections.cjs');
const {groupProblem,selectionRoots}=require('../../domain/canvasGroups.cjs');
const {insertionPoint}=require('../../canvas/presentation.cjs');
const {routingObjects}=require('../../canvas/connectionGeometry.cjs');
const {connectorPath}=require('../../canvas/interaction.cjs'),{pathLabel}=require('../../canvas/routing.cjs');
export default function CanvasEditor({board,project,scope,onClose,go,openTask,openProject}){
 useRenderMetric('canvas/editor');
 const {saveCanvas,saveCanvasViewport,flush,error:storageError}=useStore(),{c}=useTheme(),size=useWindowDimensions();
 const [draft,setDraft]=useState(board),current=useRef(board),expected=useRef(board.revision),pending=useRef(false),serial=useRef(0),mounted=useRef(true),autoSaveTimer=useRef(null);
 const [status,setStatus]=useState(storageError?'Save failed':'Saved on this device'),[error,setError]=useState(''),[selected,setSelected]=useState([]),[mode,setMode]=useState('select'),[panel,setPanelState]=useState(''),[query,setQuery]=useState(''),[text,setText]=useState(''),[reply,setReply]=useState(''),[title,setTitle]=useState(board.title),[snapshot,setSnapshot]=useState(false),[objectQuery,setObjectQuery]=useState(''),[edgeId,setEdgeId]=useState(''),[diagramSource,setDiagramSource]=useState('taskDiagram'),[nodeId,setNodeId]=useState(''),[threadReplies,setThreadReplies]=useState({}),[commentLimit,setCommentLimit]=useState(20);
 const [viewport,setViewport]=useState({width:size.width,height:Math.max(200,size.height-300)}),[request,setRequest]=useState(0),[initialPose,setInitialPose]=useState(board.viewport),pose=useRef(board.viewport),reportedScale=useRef(board.viewport.scale),[zoom,setZoom]=useState(board.viewport.scale);
 useEffect(()=>{diagnosticMonitor.recordAction(`canvas opened: ${board.objects.length} objects, ${board.connectors.length} connections`);},[]);
 const [brushWidth,setBrushWidth]=useState(3),[brushColor,setBrushColor]=useState(''),[erasing,setErasing]=useState(false),eraseBusy=useRef(false);
 const [inlineEdit,setInlineEdit]=useState(null),inlineRef=useRef(null);
 const presence=useCloudPresence(project.id,'canvas:'+board.id,!!inlineEdit);
 const setInline=value=>{inlineRef.current=value;setInlineEdit(value);};
 const [activeComment,setActiveComment]=useState(''),[commentTarget,setCommentTarget]=useState(null),lastCommentPost=useRef(null),panelRef=useRef(panel),panelHistory=useRef([]);
 const parents={objects:'tools',selection:'objects',inspect:'selection',arrange:'selection',appearance:'inspect',color:'inspect',diagram:'inspect',node:'diagram',source:'add','project-diagram':'add',view:'tools',comments:'tools',export:'board',settings:'board',connector:''};
 const setPanel=next=>{const value=typeof next==='function'?next(panelRef.current):next;if(!value||['tools','add','board','select'].includes(value))panelHistory.current=[];else if(panelHistory.current.length&&panelHistory.current.at(-1)===value)panelHistory.current.pop();else if(panelRef.current!==value)panelHistory.current.push(panelRef.current);if(value)setActiveComment('');panelRef.current=value;setPanelState(value);};
 const backPanel=()=>{const value=panelHistory.current.length?panelHistory.current.pop():parents[panelRef.current]||'';panelRef.current=value;setPanelState(value);};
 const undo=useRef([]),redo=useRef([]),measured=useRef(false);
 const camera=useCanvasCamera(board.viewport),insets=useSafeAreaInsets();
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;clearTimeout(autoSaveTimer.current);void flush();};},[flush]);
 const reportSave=async()=>{clearTimeout(autoSaveTimer.current);const token=++serial.current;setStatus('Saving…');const ok=await flush();if(mounted.current&&token===serial.current){setStatus(ok?'Saved on this device':'Save failed');if(!ok)setError('Local save failed. Keep this screen open and retry.');}return ok;};
 const commit=(next,history=true)=>{
  serial.current++;
  if(history){undo.current=pushHistory(undo.current,canvas.contentOf(current.current));redo.current=[];}
  current.current=next;setDraft(next);setError('');
  if(saveCanvas(next,expected.current)){expected.current=next.revision;pending.current=false;setStatus('Saving…');clearTimeout(autoSaveTimer.current);autoSaveTimer.current=setTimeout(()=>{void reportSave();},180);return true;}
  pending.current=true;setStatus('Unsaved changes');setError('Canvas changed or could not be saved. Export a board backup before reopening the saved version.');return false;
 };
 const perform=command=>{try{const base={...current.current,viewport:pose.current,revision:expected.current};return commit(canvas.changeBoard(base,command,model.iso()));}catch(e){setError(e.message);return false;}};
 const retry=async()=>{if(pending.current){if(!saveCanvas(current.current,expected.current)){setError('The saved revision changed. Export a board backup before reopening.');return false;}expected.current=current.current.revision;pending.current=false;}return reportSave();};
 const persistView=async()=>{if(pending.current&&!await retry())return false;if(!saveCanvasViewport(board.id,pose.current,expected.current)){setError('The saved board changed; keep a backup before leaving.');return false;}return reportSave();};
 const close=async()=>{if(inlineRef.current&&!finishInline())return;if(await persistView())onClose();};
 useBackDismiss(true,close,20);
 const setPose=next=>{const previous=reportedScale.current;reportedScale.current=next.scale;pose.current=next;setZoom(next.scale);if(previous<1.25&&next.scale>=1.25){const visible=markers.map(m=>{const p=commentPosition(m.anchor,m.box,null);return {id:m.anchor.id,x:p.x*next.scale+next.x,y:p.y*next.scale+next.y};}).filter(p=>p.x>=0&&p.y>=0&&p.x<=viewport.width&&p.y<=viewport.height).sort((a,b)=>Math.hypot(a.x-viewport.width/2,a.y-viewport.height/2)-Math.hypot(b.x-viewport.width/2,b.y-viewport.height/2));if(visible.length){setPanel('');setActiveComment(visible[0].id);}}};
 const navigate=next=>{setPose(next);setInitialPose(next);setRequest(n=>n+1);};
 const select=id=>{
  if(inlineRef.current&&!finishInline())return;

  setActiveComment('');setEdgeId('');setPanel('');
  if(mode==='connect'&&id&&selected.length===1&&selected[0]!==id){if(perform({type:'connect',edge:{id:model.id('edge'),from:selected[0],to:id,label:'',arrow:false,style:'curve',color:randomLineColor()}}))setMode('select');setSelected([id]);return;}
  setSelected(ids=>selectObject(ids,id,mode==='multi'));
 };
 const connect=(from,to)=>{if(from===to)return false;return perform({type:'connect',edge:{id:model.id('edge'),from,to,label:'',arrow:false,style:'curve',color:randomLineColor()}});};
 const transformResult=(command,gesture)=>{const before=current.current;const ok=perform({...command,...(gesture?{bases:gesture.boxes}:{})});return gesture?{accepted:current.current!==before,revision:current.current.revision}:ok;};
 const resize=(id,width,height,gesture)=>transformResult({type:'patch',id,patch:{width,height}},gesture);
 const startConnect=id=>{setSelected([id]);setMode('connect');};
 const move=(ids,dx,dy,gesture)=>transformResult({type:'move',ids,dx,dy},gesture);
 const fittedDiagram=(o,scale=1)=>{const scene=objectScene(o,project,scope).scene,factor=Math.min(scale,20000/scene.width,20000/scene.height);return {...o,width:Math.max(40,scene.width*factor),height:Math.max(32,scene.height*factor)};};
 const add=(type,diagramType='tree')=>{
  const now=model.iso(),point=insertionPoint(pose.current,viewport);let object=canvas.createObject({id:model.id('object'),boardId:board.id,type,x:point.x,y:point.y,text:type==='frame'?'Frame':type==='diagram'?'Brainstorm':'',now,zIndex:Math.min(100000,Math.max(0,...draft.objects.map(o=>o.zIndex))+1),...(type==='frame'?{width:640,height:400}:type==='diagram'?{width:640,height:400,diagramType,direction:'right',nodes:[{id:'w0',parent:null,name:'Brainstorm',hours:0},{id:'w1',parent:'w0',name:'First idea',hours:0}]}:{})});
  if(type==='diagram'){object=fittedDiagram(object);const value=objectScene(object,project,scope),root=value.scene.items.find(i=>i.nodeId==='w0'&&i.t==='rect');if(root)object={...object,x:point.x+120-root.x*value.scale-root.w*value.scale/2,y:point.y-root.y*value.scale};}
  if(perform({type:'add',objects:[object]})){setSelected([object.id]);setText(object.text);setPanel('');setMode('select');}
 };
 const draw=points=>{const x=Math.min(...points.map(p=>p.x)),y=Math.min(...points.map(p=>p.y)),right=Math.max(...points.map(p=>p.x)),bottom=Math.max(...points.map(p=>p.y));const o=canvas.createObject({id:model.id('stroke'),boardId:board.id,type:'draw',x,y,width:Math.max(40,right-x),height:Math.max(32,bottom-y),points:points.map(p=>({x:p.x-x,y:p.y-y})),strokeWidth:brushWidth,color:brushColor,now:model.iso()});return perform({type:'add',objects:[o]});};
 const erase=async points=>{if(eraseBusy.current)return;eraseBusy.current=true;setErasing(true);try{const objects=current.current.objects,ids=[],radius=12/pose.current.scale;for(let i=0;i<objects.length;i+=16){ids.push(...erasedStrokeIds(objects.slice(i,i+16),points,radius));if(i+16<objects.length)await new Promise(resolve=>setTimeout(resolve,0));}if(!mounted.current)return;const existing=new Set(current.current.objects.filter(o=>o.type==='draw'&&!o.locked).map(o=>o.id)),remove=ids.filter(id=>existing.has(id));if(remove.length)perform({type:'remove',ids:remove});}finally{eraseBusy.current=false;if(mounted.current)setErasing(false);}};
 const travel=direction=>{const from=direction==='undo'?undo:redo,to=direction==='undo'?redo:undo;if(!from.current.length)return;const content=from.current.at(-1),next=canvas.changeBoard({...current.current,revision:expected.current},{type:'restore',content},model.iso());to.current=pushHistory(to.current,canvas.contentOf(current.current));from.current=from.current.slice(0,-1);commit(next,false);setSelected([]);};
 const object=draft.objects.find(o=>o.id===selected[0]),source=object?.sourceLink?readSource(project,object.sourceLink):null;
 const inspect=()=>{setText(object?.text||'');setPanel(object?'inspect':'objects');};
 const finishInline=(cancel=false)=>{const edit=inlineRef.current;if(!edit)return true;const latest=current.current.objects.find(o=>o.id===edit.id);if(cancel||!latest||latest.locked){setInline(null);return true;}
  const node=edit.nodeId&&latest.nodes?.find(n=>n.id===edit.nodeId),before=node?(node.id==='w0'?latest.text||node.name:node.name):latest.text;
  if(edit.nodeId&&!node){setInline(null);return true;}if(edit.value===before){setInline(null);return true;}if(edit.original!==undefined&&before!==edit.original){setError('Text changed during editing. Copy your draft before cancelling and reopening the editor.');return false;}
  const patch=edit.nodeId?{nodes:latest.nodes.map(n=>n.id===edit.nodeId?{...n,name:edit.value}:n),...(edit.nodeId==='w0'?{text:edit.value}:{})}:{text:edit.value};
  if(latest.type==='diagram'){const next=fittedDiagram({...latest,...patch},objectScene(latest,project,scope).scale||1);patch.width=next.width;patch.height=next.height;}
  setInline(null);return perform({type:'patch',id:edit.id,patch});
 };
 const editObject=(id,point)=>{const o=current.current.objects.find(o=>o.id===id);if(!o)return;setEdgeId('');setSelected([id]);const target=localEditTarget(o,objectScene(o,project,scope),point);if(target){setPanel('');setInline({...target,original:target.value});}else if(o.type!=='diagram'){setText(o.text||'');setPanel('inspect');}};
 const editEdge=id=>{setSelected([]);setEdgeId(id);setText(current.current.connectors.find(e=>e.id===id)?.label||'');setPanel('');};
 const edge=draft.connectors.find(e=>e.id===edgeId);
 const deleteSelection=()=>{if(perform({type:'remove',ids:selected})){setSelected([]);setPanel('');}};
 const patch=changes=>{if(!object)return false;let patch=changes;if(object.type==='frame'&&draft.objects.some(o=>o.groupId===object.id)&&('width' in changes||'height' in changes)){const scale='width' in changes?changes.width/object.width:changes.height/object.height;patch={...changes,width:object.width*scale,height:object.height*scale};}if(object.type==='diagram'&&('diagramType' in changes||'direction' in changes||'nodes' in changes||'text' in changes)||object.type==='linked'&&changes.sourceLink&&['wbs','taskDiagram'].includes(changes.sourceLink.sourceType)){const previous=objectScene(object,project,scope),next=fittedDiagram({...object,...changes},previous.scale||1);patch={...changes,width:next.width,height:next.height};}return perform({type:'patch',id:object.id,patch});};

 const options=useMemo(()=>panel==='source'?sourceOptions(project).filter(o=>`${o.title} ${o.sourceType}`.toLowerCase().includes(query.toLowerCase())):[],[project,query,panel]);
 const insert=option=>{
  const now=model.iso(),point=insertionPoint(pose.current,viewport);let link={...option,view:option.view||'tree',direction:'right'};
  if(snapshot)link=captureSource(project,link,now);const value=readSource(project,link);if(!value.available)throw Error(value.lines[0]||'Source unavailable');
  let o=canvas.createObject({id:model.id('object'),boardId:board.id,type:'linked',sourceLink:link,x:point.x,y:point.y,now,...(value.kind==='diagram'?{width:800,height:480}:value.kind==='roadmap'?{width:800,height:Math.max(240,Math.min(20000,80+value.tasks.length*44))}:{width:280,height:200})});
  if(value.kind==='diagram'||value.kind==='roadmap'){const layout=objectScene(o,project,scope).scene,factor=Math.min(1,20000/layout.width,20000/layout.height);o={...o,width:Math.max(40,layout.width*factor),height:Math.max(32,layout.height*factor)};const root=layout.items.find(i=>i.nodeId==='w0'&&i.t==='rect');if(root)o={...o,x:point.x+120-(root.x+root.w/2)*factor,y:point.y-root.y*factor};}
  if(perform({type:'add',objects:[o]})){setSelected([o.id]);setPanel('');setMode('select');}
 };
 const copySelected=()=>{if(!selected.length)return;try{const incoming=canvas.duplicateBoard(canvas.selectionBoard(draft,selected),{id:board.id,now:model.iso(),nextId:()=>model.id('item')}),content=canvas.contentOf(draft);content.objects.push(...incoming.objects.map(o=>({...o,x:o.x+32,y:o.y+32})));content.connectors.push(...incoming.connectors);content.threads.push(...incoming.threads);if(perform({type:'restore',content}))setSelected(incoming.objects.map(o=>o.id));}catch(e){setError(e.message);}};
 const copyToClipboard=async()=>{try{await require('expo-clipboard').setStringAsync(canvas.exportBoard(canvas.selectionBoard(draft,selected)));setStatus('Selection copied');}catch(e){setError(e.message);}};

 const pasteClipboard=async()=>{try{const raw=await require('expo-clipboard').getStringAsync();if(!mounted.current)return;const incoming=canvas.importBoard(raw,{id:model.id('paste'),projectId:project.id,now:model.iso(),nextId:()=>model.id('item')}),content=canvas.contentOf(current.current);content.objects.push(...incoming.objects.map(o=>({...o,boardId:board.id,x:o.x+32,y:o.y+32})));content.connectors.push(...incoming.connectors);content.threads.push(...incoming.threads);if(perform({type:'restore',content}))setSelected(incoming.objects.map(o=>o.id));}catch(e){setError('Canvas paste failed: '+e.message);}};
 const groupingProblem=groupProblem(draft.objects,selected),transformIds=new Set(movingIds(draft.objects,selected)),selectionLocked=draft.objects.some(o=>o.locked&&transformIds.has(o.id));
 const group=()=>{const problem=groupProblem(current.current.objects,selected);if(problem){setError(problem);return;}const now=model.iso(),objects=current.current.objects.filter(o=>selected.includes(o.id)),b=objectBounds(objects),id=model.id('frame'),frame=canvas.createObject({id,boardId:board.id,type:'frame',text:'Group',x:b.x,y:b.y,width:b.width,height:b.height,zIndex:0,now});if(perform({type:'group',ids:selected,frame}))setSelected([id]);};
 const align=()=>perform({type:'align',ids:selected});
 const openSource=async()=>{if(!object?.sourceLink||!source?.available||object.sourceLink.originProjectId&&object.sourceLink.originProjectId!==project.id)return;if(!await persistView())return;const type=object.sourceLink.sourceType;if(type==='taskDiagram')go('tasks');else if(type==='task')openTask(object.sourceLink.sourceId);else if(type==='roadmap')go('timeline');else if(type==='sprint')go('sprints');else openProject(project.id,type==='wbs'?'wbs':type==='risk'?'risks':type==='stakeholder'?'stakeholders':type==='document'?object.sourceLink.sourceId:'overview');};
 const addComment=()=>{if(!reply.trim())return;const post=JSON.stringify([reply,commentTarget,selected]);if(lastCommentPost.current===post)return;const now=model.iso(),point=commentTarget||worldPoint(80,80,pose.current),id=model.id('thread');if(perform({type:'thread',thread:{id,objectId:commentTarget?'':selected[0]||'',x:point.x,y:point.y,messages:[{id:model.id('message'),authorId:canvas.LOCAL_OWNER,text:reply.trim(),at:now}]}})){lastCommentPost.current=post;setReply('');setCommentTarget(null);setPanel('');setActiveComment(id);}};
 const tool=next=>{if(!finishInline())return;setActiveComment('');if(next==='select'&&mode==='select'){setPanel(value=>value==='select'?'':'select');return;}const state=changeTool(mode,next);setMode(state.mode);setPanel(value=>value===state.panel?'':state.panel);};
 const allPose=()=>{const value=current.current,pins=commentGeometry(value.threads,routingObjects(value.objects)).map(m=>{const p=commentPosition(m.anchor,m.box,null);return {x:p.x-8,y:p.y-8,width:16,height:16};});return fitPose([...value.objects,...pins],viewport);};
 const fitSelection=()=>{const ids=edge?[edge.from,edge.to]:selected;if(ids.length)navigate(fitPose(canvas.selectionBoard(current.current,ids).objects,viewport));};
 const headerRef=useRef(null);headerRef.current={close,travel:direction=>{if(finishInline())travel(direction);},fit:()=>navigate(allPose()),more:()=>{if(finishInline())setPanel(value=>value==='board'?'':'board');}};
 const canUndo=!!undo.current.length,canRedo=!!redo.current.length;
 const headerControls=useMemo(()=>({canvas:true,title:draft.title,onBack:()=>headerRef.current.close(),chrome:<CanvasHeader title={draft.title} zoom={zoom} onBack={()=>headerRef.current.close()} onUndo={()=>headerRef.current.travel('undo')} onRedo={()=>headerRef.current.travel('redo')} canUndo={canUndo} canRedo={canRedo} onFit={()=>headerRef.current.fit()} onMore={()=>headerRef.current.more()}/>,}),[draft.title,zoom,canUndo,canRedo]);
 useHeaderActions('canvas',headerControls);
 const objectItems=useMemo(()=>panel==='objects'?draft.objects.map(o=>({id:o.id,label:o.text||(o.sourceLink?readSource(project,o.sourceLink).title:o.type),detail:o.locked?`${o.type} · Locked`:o.type,icon:o.type==='linked'?'link':o.type==='draw'?'edit-2':'square',selected:selected.includes(o.id)})):[],[panel,draft.objects,project,selected]);

 const markers=useMemo(()=>commentGeometry(draft.threads,routingObjects(draft.objects)),[draft.threads,draft.objects]),comment=draft.threads.find(t=>t.id===activeComment),commentMarker=markers.find(m=>m.anchor.id===activeComment);
 const openComment=id=>{setPanel('');setActiveComment(id);};
 const deleteAnchor=useMemo(()=>{if(!edge)return null;const a=draft.objects.find(o=>o.id===edge.from),b=draft.objects.find(o=>o.id===edge.to);if(!a||!b)return null;const at=pathLabel(connectorPath(a,b,null,edge.style,draft.objects));return {x:at.x*pose.current.scale+pose.current.x,y:at.y*pose.current.scale+pose.current.y};},[edge,draft.objects,panel,zoom]);
 const overlayBoxes=useMemo(()=>routingObjects(draft.objects.filter(o=>selected.includes(o.id)||edge&&(o.id===edge.from||o.id===edge.to))),[draft.objects,selected,edge]);
 const overlay={boxes:overlayBoxes,extent:edge?162:266,bottom:Math.max(12,insets.bottom)+72};
 const feedback=error?<T color={c.danger} accessibilityRole="alert">{error}</T>:null;
 const keyHandler=useRef(null);keyHandler.current=e=>{if(/INPUT|TEXTAREA/.test(e.target?.tagName)||e.target?.isContentEditable)return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();travel(e.shiftKey?'redo':'undo');}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='c'&&selected.length){e.preventDefault();void copyToClipboard();}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='v'){e.preventDefault();void pasteClipboard();}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'){e.preventDefault();copySelected();}else if(e.key==='Delete'&&edgeId){e.preventDefault();setPanel('delete-connector');}else if(e.key==='Delete'&&selected.length){e.preventDefault();perform({type:'remove',ids:selected});setSelected([]);}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)&&selected.length){e.preventDefault();move(selected,e.key==='ArrowLeft'?-8:e.key==='ArrowRight'?8:0,e.key==='ArrowUp'?-8:e.key==='ArrowDown'?8:0);}else if(e.key==='Escape'){finishInline(true);setPanel('');setSelected([]);}else if(!e.ctrlKey&&!e.metaKey&&!e.altKey&&['v','h','d','c','a'].includes(e.key.toLowerCase())){e.preventDefault();tool({v:'select',h:'pan',d:'draw',c:'connect',a:'add'}[e.key.toLowerCase()]);}else if(e.key==='0')navigate(allPose());};
 useEffect(()=>{if(Platform.OS!=='web')return;const handler=e=>keyHandler.current(e);window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[]);
 return <View style={{flex:1,backgroundColor:c.bg}}>
  {error||storageError?<View style={{padding:12,gap:8}}><T color={c.danger} size={12} accessibilityRole="alert">{error||storageError}</T><Button label="Retry save" variant="secondary" onPress={retry}/></View>:null}
  <CanvasPopoverHost value={{onBack:panelHistory.current.length||Object.hasOwn(parents,panel)?backPanel:undefined,viewport,bottom:Math.max(12,insets.bottom)+72,contextual:!!(object||edge)&&!inlineEdit&&!['add','tools','board','view','source','project-diagram','objects'].includes(panel)&&mode!=='draw'&&mode!=='erase'}}>
  <View style={{flex:1,minHeight:160,overflow:'hidden'}} onLayout={e=>{const {width,height}=e.nativeEvent.layout;if(width>0&&height>0){if(!measured.current){measured.current=true;const saved=board.viewport;if(board.revision===0&&board.objects.length&&saved.scale===1&&saved.x===32&&saved.y===32){const target=board.objects.find(o=>['note','text','card','shape'].includes(o.type))||board.objects[0];navigate(readablePose([target],{width,height},objectScene(target,project,scope)));}}setInitialPose(pose.current);setViewport(old=>old.width===width&&old.height===height?old:{width,height});}}}>
   <CanvasSurface camera={camera} overlay={overlay} markers={markers} commentOverlay={commentMarker} onComment={openComment} onPlaceComment={point=>{setCommentTarget(point);setMode('select');setPanel('comments');}} board={draft} project={project} scope={scope} selected={selected} selectedEdge={edgeId} mode={inlineEdit?'editing':mode} viewport={viewport} request={request} initialPose={initialPose} onSelect={select} onMove={move} onDraw={draw} onErase={erase} brushWidth={brushWidth} brushColor={brushColor} onPose={setPose} onPreviewPose={value=>{pose.current=value;}} onEditObject={editObject} onEditEdge={editEdge} onResize={resize} onConnect={connect} onStartConnect={startConnect} />
   {inlineEdit?<CanvasInlineEditor key={`${inlineEdit.id}:${inlineEdit.nodeId}`} edit={inlineEdit} pose={pose.current} viewport={viewport} onChange={value=>{if(inlineRef.current)inlineRef.current={...inlineRef.current,value};}} onDone={()=>finishInline()} onCancel={()=>finishInline(true)}/>:null}
   {comment&&commentMarker?<CanvasCommentBubble key={comment.id} thread={comment} {...commentMarker} camera={camera} viewport={viewport} onClose={()=>setActiveComment('')} onReply={value=>perform({type:'reply',id:comment.id,message:{id:model.id('message'),text:value,at:model.iso()}})} onResolve={()=>perform({type:'resolve',id:comment.id,resolved:!comment.resolvedAt})}/>:null}
   {mode==='comment'?<View pointerEvents="none" style={{position:'absolute',top:12,left:12,right:12}}><T>Tap where the comment belongs</T></View>:null}
   {presence.viewers?<View pointerEvents="none" style={{position:'absolute',top:12,left:12,right:12}}><T muted size={12}>{presence.editing?'Another member is currently editing this Canvas':`${presence.viewers} other member(s) viewing`}</T></View>:null}
   {!draft.objects.length?<View pointerEvents="none" style={{position:'absolute',left:32,right:32,top:48,gap:8}}><T size={22} weight="500">Space for the next idea</T><T muted>Add a note, bring in a project source, or start drawing</T></View>:null}
   {!inlineEdit?<>
    <CanvasToolbar mode={mode} panel={panel} onTool={tool}/>
    {!activeComment&&(!panel||!['add','tools','board','view','source','project-diagram','objects'].includes(panel))&&mode!=='draw'&&mode!=='erase'&&(object||edge)?<CanvasContextToolbar object={object} edge={edge} count={selected.length} boxes={panel?[]:overlayBoxes} camera={camera} viewport={viewport} bottom={overlay.bottom} appearance={false} groupDisabled={!!groupingProblem} alignDisabled={selectionLocked||selectionRoots(draft.objects,selected).length<2} onAppearance={()=>setPanel('color')} onCloseAppearance={()=>setPanel('')} onEdit={()=>editObject(object.id)} onColor={color=>{if(patch({color}))setPanel('');}} onDuplicate={copySelected} onMore={()=>selected.length>1?setPanel('selection'):inspect()} onGroup={group} onAlign={align} onFit={fitSelection} onLayout={()=>setPanel('diagram')} sourceAvailable={!!source?.available&&(!object.sourceLink.originProjectId||object.sourceLink.originProjectId===project.id)} onSource={openSource} onWidth={()=>setPanel('appearance')} onArrange={()=>setPanel('arrange')} onStyle={()=>setPanel('connector')} onDelete={()=>setPanel('delete-connector')}/>:null}
    {panel==='add'?<CanvasAddMenu viewport={viewport} onClose={()=>setPanel('')} onAdd={add} onSource={()=>setPanel('source')} onProjectDiagram={()=>{setDiagramSource('taskDiagram');setPanel('project-diagram');}}/>:null}

    {(mode==='draw'||mode==='erase')&&!panel?<CanvasBrushPalette viewport={viewport} mode={mode} busy={erasing} width={brushWidth} color={brushColor} onMode={setMode} onWidth={setBrushWidth} onColor={setBrushColor}/>:null}
   </>:null}
  {panel==='select'?<CanvasPopover viewport={viewport} title="Selection mode" onClose={()=>setPanel('')}><CanvasMenuRow label="Single selection" icon="mouse-pointer" selected={mode==='select'} onPress={()=>{setMode('select');setPanel('');}}/><CanvasMenuRow label="Multiple selection" icon="check-square" selected={mode==='multi'} onPress={()=>{setMode('multi');setPanel('');}}/></CanvasPopover>:null}
  {panel==='view'?<CanvasPopover viewport={viewport} title="Canvas view" compact onClose={()=>setPanel('')}>
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:4}}>{[['Fit selection','maximize',()=>{fitSelection();setPanel('');},!selected.length&&!edge],['Fit all','maximize',()=>{navigate(allPose());setPanel('');}],['Zoom out','minus',()=>navigate(zoomAt(pose.current,.8,{x:viewport.width/2,y:viewport.height/2}))],['Zoom in','plus',()=>navigate(zoomAt(pose.current,1.25,{x:viewport.width/2,y:viewport.height/2}))],['Reset to 100%','rotate-ccw',()=>navigate({scale:1,x:32,y:32})]].map(([label,icon,onPress,disabled])=><View key={label} style={{width:'48%'}}><CanvasMenuRow label={label} icon={icon} disabled={!!disabled} onPress={onPress}/></View>)}</View>
   <CanvasPanButtons onPan={(x,y)=>navigate({...pose.current,x:pose.current.x+x,y:pose.current.y+y})}/>
  </CanvasPopover>:null}
  {panel==='tools'?<CanvasPopover title="Canvas tools" viewport={viewport} extent={280} onClose={()=>setPanel('')}>
   <View style={{flexDirection:'row',justifyContent:'space-between',gap:4}}>{[['Objects','layers','objects'],['View','maximize','view'],['Comments','message-circle','comments']].map(([label,icon,next])=><CanvasTool key={label} label={label} icon={icon} onPress={()=>setPanel(next)}/>)}</View>
  </CanvasPopover>:null}
  {panel==='board'?<CanvasPopover title="Board actions" viewport={viewport} top onClose={()=>setPanel('')}><CanvasMenuRow label="Board settings" icon="settings" onPress={()=>setPanel('settings')}/><CanvasMenuRow label="Export and backup" icon="download" onPress={()=>setPanel('export')}/><T muted size={12} accessibilityLiveRegion="polite">{status}</T></CanvasPopover>:null}
  {panel==='selection'?<CanvasPopover viewport={viewport} title="Selection actions" onClose={()=>setPanel('')}>
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:4}}>{[['Object properties','sliders',inspect,!selected.length],['Arrange and resize','move',()=>setPanel('arrange'),!selected.length],['Copy','copy',copyToClipboard,!selected.length],['Paste','clipboard',pasteClipboard,false],['Group','layers',group,!!groupingProblem],['Delete selection','trash-2',deleteSelection,!selected.length]].map(([label,icon,onPress,disabled])=><View key={label} style={{width:'48%'}}><CanvasMenuRow label={label} icon={icon} disabled={disabled} danger={label==='Delete selection'} onPress={onPress}/></View>)}</View>
  </CanvasPopover>:null}
  {panel==='export'?<CanvasPopover viewport={viewport} title="Export Canvas" compact onClose={()=>setPanel('')}><CanvasExports board={draft} project={project} scope={scope} onClose={()=>setPanel('')}/></CanvasPopover>:null}
  {panel==='project-diagram'?<CanvasPopover viewport={viewport} title={diagramSource==='wbs'?'WBS diagram':'Project task diagram'} compact onClose={()=>setPanel('')}>
   {feedback}<T muted size={13}>{diagramSource==='wbs'?'Uses work elements from Project Artifacts → WBS':'Uses project tasks and their parent/subtask links'}</T>
   {diagramSource==='taskDiagram'&&!project.tasks.length?<T muted>Add tasks to this project first</T>:null}
   {['tree','fishbone','mind'].map(view=><CanvasMenuRow key={view} icon={view==='mind'?'share-2':'git-branch'} label={view==='tree'?'Project Tree':view==='fishbone'?'Project Fishbone':'Project Mind Map'} disabled={diagramSource==='taskDiagram'&&!project.tasks.length} onPress={()=>{try{insert({sourceType:diagramSource,sourceId:diagramSource==='wbs'?'w0':project.id,projectId:project.id,mode:'live',view});}catch(e){setError(e.message);}}}/>)}
  </CanvasPopover>:null}
  {panel==='source'?<CanvasPopover viewport={viewport} title="Project sources" compact scrollable={false} onClose={()=>setPanel('')}>
   <CanvasSources options={options} query={query} onQuery={setQuery} snapshot={snapshot} onSnapshot={setSnapshot} error={error} onInsert={option=>{try{if(option.sourceType==='wbs'){setDiagramSource('wbs');setPanel('project-diagram');}else insert(option);}catch(e){setError(e.message);}}}/>
  </CanvasPopover>:null}
  {panel==='inspect'?<CanvasPopover viewport={viewport} compact title={object?'Canvas object':'Objects'} onClose={()=>setPanel('')}>
   {error?<T color={c.danger} accessibilityRole="alert">{error}</T>:null}
   {object?<>
    <CanvasMenuRow label="Comment on selection" icon="message-circle" onPress={()=>setPanel('comments')}/><T size={12} muted>{object.type}{object.locked?' · Locked':''}</T>
    {object.type!=='linked'&&object.type!=='draw'?<><Input value={text} onChangeText={setText} multiline accessibilityLabel="Canvas object text"/><Button label="Save text" disabled={object.locked} onPress={()=>patch({text})}/></>:object.type==='linked'?<><T>{source?.title}</T>{source?.lines?.map((s,i)=><T key={i} muted>{s}</T>)}<Button label="Open canonical source" disabled={!source?.available||!!object.sourceLink.originProjectId&&object.sourceLink.originProjectId!==project.id} onPress={openSource}/><Button label="Capture snapshot" variant="secondary" disabled={object.locked||!source?.available||object.sourceLink.mode==='snapshot'} onPress={()=>{try{patch({sourceLink:captureSource(project,object.sourceLink,model.iso())});}catch(e){setError(e.message);}}}/></>:null}
    {object.type!=='linked'&&object.type!=='draw'?<CanvasMenuRow label="Edit on canvas" icon="edit-3" disabled={object.locked} onPress={()=>editObject(object.id)}/>:null}
    <View style={{gap:0}}><T size={12} muted>Properties</T><CanvasMenuRow label="Arrange and resize" icon="move" onPress={()=>setPanel('arrange')}/>{object.type!=='diagram'&&!['wbs','taskDiagram'].includes(object.sourceLink?.sourceType)?<CanvasMenuRow label="Appearance" icon="sliders" onPress={()=>setPanel('appearance')}/>:null}{object.type==='diagram'||['wbs','taskDiagram'].includes(object.sourceLink?.sourceType)?<CanvasMenuRow label="Diagram layout and branches" icon="git-branch" onPress={()=>setPanel('diagram')}/>:null}</View>
    <Button label={selected.length>1?'Delete selected elements':'Delete element'} variant="danger" disabled={object.locked} onPress={deleteSelection}/>
   </>:null}
  </CanvasPopover>:null}
  {panel==='arrange'?<CanvasPopover viewport={viewport} title="Arrange and resize" onClose={()=>setPanel('')}>{feedback}{object?<>

    <View style={{flexDirection:'row',flexWrap:'wrap',gap:4}}>{[[object.locked?'Unlock object':'Lock object',object.locked?'unlock':'lock',()=>perform({type:'lock',id:object.id,locked:!object.locked}),false],['Bring to front','chevrons-up',()=>perform({type:'layer',id:object.id,front:true}),object.locked],['Send to back','chevrons-down',()=>perform({type:'layer',id:object.id,front:false}),object.locked],['Ungroup','layers',()=>perform({type:'ungroup',id:object.id}),selectionLocked||!object.groupId&&!draft.objects.some(o=>o.groupId===object.id)]].map(([label,icon,onPress,disabled])=><View key={label} style={{width:'48%'}}><CanvasMenuRow label={label} icon={icon} onPress={onPress} disabled={disabled}/></View>)}</View>
    <T size={12} muted>Move</T><View style={{flexDirection:'row',gap:4}}>{[['Left','arrow-left',-16,0],['Right','arrow-right',16,0],['Up','arrow-up',0,-16],['Down','arrow-down',0,16]].map(([label,icon,dx,dy])=><CanvasTool key={label} label={label} icon={icon} disabled={selectionLocked} onPress={()=>move(selected,dx,dy)}/>)}</View>
    <T size={12} muted>Resize</T><View style={{flexDirection:'row',gap:4}}>{[['Wider','width',32],['Narrower','width',-32],['Taller','height',32],['Shorter','height',-32]].map(([label,field,delta])=><CanvasTool key={label} label={label} icon={delta>0?'plus':'minus'} disabled={selectionLocked} onPress={()=>patch({[field]:object[field]+delta})}/>)}</View>
   </>:null}</CanvasPopover>:null}
  {panel==='color'?<CanvasPopover viewport={viewport} title="Color" onClose={()=>setPanel('')}><CanvasSwatches value={object?.color||''} disabled={object?.locked} onChange={color=>{if(patch({color}))setPanel('');}}/></CanvasPopover>:null}
  {panel==='appearance'?<CanvasPopover viewport={viewport} title="Appearance" compact onClose={()=>setPanel('')}>{feedback}{object?<>
    {object.type==='draw'?<><T size={12} muted>Stroke width</T><Segmented options={[1,3,6,12,24].map(value=>({value,label:`${value}`}))} value={object.strokeWidth||2} onChange={strokeWidth=>patch({strokeWidth})}/></>:null}
    <T size={12} muted>Color</T><CanvasSwatches value={object.color} disabled={object.locked} onChange={color=>patch({color})}/>


   </>:null}</CanvasPopover>:null}
  {panel==='diagram'?<CanvasPopover viewport={viewport} compact title="Diagram layout and branches" onClose={()=>setPanel('')}>{feedback}{object?<>
    {object.type==='diagram'?<><T size={12} muted>Layout</T><Segmented options={[{value:'tree',label:'Tree'},{value:'fishbone',label:'Fishbone'},{value:'mind',label:'Mind map'}]} value={object.diagramType} onChange={diagramType=>patch({diagramType,...(diagramType==='tree'?{direction:'right'}:{})})}/><CanvasMenuRow label="Add diagram branch" icon="plus" disabled={object.locked} onPress={()=>patch({nodes:[...object.nodes,{id:model.id('node'),parent:'w0',name:'New idea',hours:0}]})}/><T size={12} muted>Nodes</T>{object.nodes.slice(0,100).map(n=><CanvasMenuRow key={n.id} label={n.name} icon="git-branch" detail={n.id==='w0'?'Root':'Branch'} onPress={()=>{setNodeId(n.id);setPanel('node');}}/>)}{object.nodes.length>100?<T muted>Double-tap any other node on the canvas to edit it</T>:null}</>:null}

    {['wbs','taskDiagram'].includes(object.sourceLink?.sourceType)?<Segmented options={[{value:'tree',label:'Tree'},{value:'fishbone',label:'Fishbone'},{value:'mind',label:'Mind map'}]} value={object.sourceLink.view} onChange={view=>patch({sourceLink:{...object.sourceLink,view,...(view==='tree'?{direction:'right'}:{})}})}/>:null}

   </>:null}</CanvasPopover>:null}
  {panel==='node'?<CanvasPopover viewport={viewport} title={object?.nodes?.find(n=>n.id===nodeId)?.name||'Diagram node'} compact onClose={()=>setPanel('')}>
   {feedback}<CanvasMenuRow label="Edit node on canvas" icon="edit-3" disabled={object?.locked} onPress={()=>{const target=object&&localEditTarget(object,objectScene(object,project,scope),null,nodeId);if(target){setPanel('');setInline({...target,original:target.value});}}}/><CanvasMenuRow label="Add child node" icon="plus" disabled={object?.locked} onPress={()=>{if(patch({nodes:[...object.nodes,{id:model.id('node'),parent:nodeId,name:'New idea',hours:0}]}))setPanel('diagram');}}/>{nodeId!=='w0'?<CanvasMenuRow label="Delete node and branches" icon="trash-2" danger disabled={object?.locked} onPress={()=>{if(patch({nodes:wbsDelete(object.nodes,nodeId)}))setPanel('diagram');}}/>:null}
  </CanvasPopover>:null}
  {panel==='objects'?<CanvasPopover viewport={viewport} compact scrollable={false} title="Objects and selection" onClose={()=>setPanel('')}>
    <CanvasItemList items={objectItems} label="Find a Canvas object" query={objectQuery} onQuery={setObjectQuery} onSelect={id=>{setSelected([id]);setText(draft.objects.find(o=>o.id===id)?.text||'');setPanel('selection');}}/>
  </CanvasPopover>:null}
  {panel==='delete-connector'&&edge?<CanvasPopover viewport={viewport} near={deleteAnchor} extent={280} title="Delete connection?" onClose={()=>setPanel('')}><View style={{flexDirection:'row',gap:8}}><Button label="Cancel" variant="secondary" onPress={()=>setPanel('')}/><Button label="Delete connection" variant="danger" onPress={()=>{if(current.current.connectors.some(e=>e.id===edge.id)&&perform({type:'disconnect',id:edge.id})){setEdgeId('');setPanel('');}}}/></View></CanvasPopover>:null}
  {panel==='connector'?<CanvasPopover viewport={viewport} title="Edit connector" compact onClose={()=>setPanel('')}>
   {feedback}
   {edge?<>
    <View style={{flexDirection:'row',alignItems:'center',gap:8}}><View style={{flex:1}}><Input value={text} accessibilityLabel="Connection label" onChangeText={setText}/></View><CanvasSvgButton label="Save" kind="save" onPress={()=>perform({type:'editConnector',id:edge.id,patch:{label:text}})}/></View>
    <View style={{flexDirection:'row',gap:8}}>{[['curve','S-curve'],['straight','Straight'],['elbow','Elbow']].map(([style,label])=><CanvasSvgButton key={style} kind={style} label={label} active={edge.style===style} onPress={()=>perform({type:'editConnector',id:edge.id,patch:{style,label:text}})}/>)}</View>
    <T size={12} muted>Color</T><CanvasSwatches colors={LINE_PALETTE} value={edge.color||''} onChange={color=>perform({type:'editConnector',id:edge.id,patch:{color}})}/>
   </>:null}
  </CanvasPopover>:null}
  {panel==='comments'?<CanvasPopover viewport={viewport} compact title="Canvas comments" onClose={()=>setPanel('')}>
   {feedback}<CanvasMenuRow label="Place on canvas" icon="message-circle" onPress={()=>{setActiveComment('');setPanel('');setSelected([]);setMode('comment');}}/>
   <T muted size={12}>{commentTarget?'Comment pinned to the chosen canvas position':selected.length?'New comments attach to the selected object':'New comments attach to the current board position'}</T><Input value={reply} onChangeText={value=>{lastCommentPost.current=null;setReply(value);}} multiline accessibilityLabel="Canvas comment"/><Button label="Add comment" disabled={!reply.trim()} onPress={addComment}/>
   {draft.threads.slice(0,commentLimit).map(thread=><View key={thread.id} style={{gap:8,paddingVertical:12,borderBottomWidth:1,borderColor:c.line}}><T size={12} muted>{thread.resolvedAt?'Resolved':'Open'} · {thread.objectId?'Object comment':'Board comment'}</T>{thread.messages.map(m=><T key={m.id}>{m.text}</T>)}<Input accessibilityLabel="Reply to Canvas thread" value={threadReplies[thread.id]||''} onChangeText={value=>setThreadReplies(values=>({...values,[thread.id]:value}))}/><Button label="Send reply" disabled={!threadReplies[thread.id]?.trim()} onPress={()=>{const text=threadReplies[thread.id]?.trim();if(text&&perform({type:'reply',id:thread.id,message:{id:model.id('reply'),text,at:model.iso()}}))setThreadReplies(values=>({...values,[thread.id]:''}));}}/><Button label={thread.resolvedAt?'Reopen thread':'Resolve thread'} variant="secondary" onPress={()=>perform({type:'resolve',id:thread.id,resolved:!thread.resolvedAt})}/></View>)}
   {draft.threads.length>commentLimit?<Button label="More comments" variant="secondary" onPress={()=>setCommentLimit(value=>value+20)}/>:null}
  </CanvasPopover>:null}
  {panel==='settings'?<CanvasPopover viewport={viewport} compact title="Canvas options" onClose={()=>setPanel('')}>
   {feedback}
   <Input value={title} onChangeText={setTitle} accessibilityLabel="Canvas title"/><Button label="Rename canvas" onPress={()=>perform({type:'rename',title:title.trim()})}/>
   <Button label="Invite / share (unavailable)" disabled variant="secondary"/><T muted>Private on this device. Sharing is unavailable.</T>

  </CanvasPopover>:null}
  </View>
  </CanvasPopoverHost>
 </View>;
}
