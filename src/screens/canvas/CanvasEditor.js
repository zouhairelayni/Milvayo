// /src/screens/canvas/CanvasEditor.js
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import { Button, IconBtn, Input, Segmented, Sheet, T } from '../../ui/ui';
import { Fold } from '../../components/inline/CompactTools';
import { useTheme } from '../../ui/theme/theme';
import { useStore } from '../../store/store';
import { useBackDismiss } from '../../app/navigation/useBackNavigation';
import { useRenderMetric } from '../../diagnostics/useRenderMetric';
import { diagnosticMonitor } from '../../diagnostics/monitor';
import { wbsDelete } from '../../governance/pm';
import CanvasSurface from '../../canvas/CanvasSurface';
import CanvasExports from './CanvasExports';
import CanvasToolbar from './CanvasToolbar';
import CanvasContextToolbar from './CanvasContextToolbar';
import CanvasAddMenu from './CanvasAddMenu';
import CanvasSwatches from './CanvasSwatches';
import CanvasSources from './CanvasSources';
import CanvasInlineEditor from './CanvasInlineEditor';
import CanvasMenuRow from './CanvasMenuRow';
import { useHeaderActions } from '../../components/shell/HeaderActions';
import { objectScene } from '../../canvas/scene';
const model=require('../../domain/model.cjs'),canvas=require('../../domain/canvas.cjs');
const {sourceOptions,readSource,captureSource}=require('../../canvas/sources.cjs');
const {fitPose,zoomAt,worldPoint,objectBounds}=require('../../canvas/interaction.cjs');
const {pushHistory}=require('../../canvas/history.cjs');
const {erasedStrokeIds}=require('../../canvas/drawing.cjs');
const {localEditTarget}=require('../../canvas/localEditing.cjs');
const {selectObject,changeTool,readablePose}=require('../../canvas/editorTools.cjs');
export default function CanvasEditor({board,project,scope,onClose,go,openTask,openProject}){
 useRenderMetric('canvas/editor');
 const {saveCanvas,saveCanvasViewport,flush,error:storageError}=useStore(),{c}=useTheme(),size=useWindowDimensions();
 const [draft,setDraft]=useState(board),current=useRef(board),expected=useRef(board.revision),pending=useRef(false),serial=useRef(0),mounted=useRef(true);
 const [status,setStatus]=useState(storageError?'Save failed':'Saved on this device'),[error,setError]=useState(''),[selected,setSelected]=useState([]),[mode,setMode]=useState('select'),[panel,setPanel]=useState(''),[query,setQuery]=useState(''),[text,setText]=useState(''),[reply,setReply]=useState(''),[title,setTitle]=useState(board.title),[snapshot,setSnapshot]=useState(false),[objectQuery,setObjectQuery]=useState(''),[edgeId,setEdgeId]=useState(''),[diagramSource,setDiagramSource]=useState('taskDiagram'),[nodeId,setNodeId]=useState(''),[threadReplies,setThreadReplies]=useState({}),[commentLimit,setCommentLimit]=useState(20);
 const [viewport,setViewport]=useState({width:size.width,height:Math.max(200,size.height-300)}),[request,setRequest]=useState(0),[initialPose,setInitialPose]=useState(board.viewport),pose=useRef(board.viewport),[zoom,setZoom]=useState(board.viewport.scale);
 useEffect(()=>{diagnosticMonitor.recordAction(`canvas opened: ${board.objects.length} objects, ${board.connectors.length} connections`);},[]);
 const [brushWidth,setBrushWidth]=useState(3),[brushColor,setBrushColor]=useState(''),[erasing,setErasing]=useState(false),eraseBusy=useRef(false);
 const [inlineEdit,setInlineEdit]=useState(null),inlineRef=useRef(null);
 const setInline=value=>{inlineRef.current=value;setInlineEdit(value);};
 const undo=useRef([]),redo=useRef([]);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;void flush();};},[flush]);
 const reportSave=async()=>{const token=++serial.current;setStatus('Saving…');const ok=await flush();if(mounted.current&&token===serial.current){setStatus(ok?'Saved on this device':'Save failed');if(!ok)setError('Local save failed. Keep this screen open and retry.');}return ok;};
 const commit=(next,history=true)=>{
  if(history){undo.current=pushHistory(undo.current,canvas.contentOf(current.current));redo.current=[];}
  current.current=next;setDraft(next);setError('');
  if(saveCanvas(next,expected.current)){expected.current=next.revision;pending.current=false;void reportSave();return true;}
  pending.current=true;setStatus('Unsaved changes');setError('Canvas changed or could not be saved. Export a board backup before reopening the saved version.');return false;
 };
 const perform=command=>{try{const base={...current.current,viewport:pose.current,revision:expected.current};return commit(canvas.changeBoard(base,command,model.iso()));}catch(e){setError(e.message);return false;}};
 const retry=async()=>{if(pending.current){if(!saveCanvas(current.current,expected.current)){setError('The saved revision changed. Export a board backup before reopening.');return false;}expected.current=current.current.revision;pending.current=false;}return reportSave();};
 const persistView=async()=>{if(pending.current&&!await retry())return false;if(!saveCanvasViewport(board.id,pose.current,expected.current)){setError('The saved board changed; keep a backup before leaving.');return false;}return reportSave();};
 const close=async()=>{if(inlineRef.current&&!finishInline())return;if(await persistView())onClose();};
 useBackDismiss(true,close,20);
 const setPose=next=>{pose.current=next;setZoom(next.scale);};
 const navigate=next=>{setPose(next);setInitialPose(next);setRequest(n=>n+1);};
 const select=id=>{
  if(inlineRef.current&&!finishInline())return;

  setEdgeId('');
  if(mode==='connect'&&id&&selected.length===1&&selected[0]!==id){if(perform({type:'connect',edge:{id:model.id('edge'),from:selected[0],to:id,label:'',arrow:false,style:'curve'}}))setMode('select');setSelected([id]);return;}
  setSelected(ids=>selectObject(ids,id,mode==='multi'));
 };
 const connect=(from,to)=>{if(from===to)return false;return perform({type:'connect',edge:{id:model.id('edge'),from,to,label:'',arrow:false,style:'curve'}});};
 const resize=(id,width,height)=>perform({type:'patch',id,patch:{width,height}});
 const startConnect=id=>{setSelected([id]);setMode('connect');};
 const move=(ids,dx,dy)=>perform({type:'move',ids,dx,dy});
 const fittedDiagram=(o,scale=1)=>{const scene=objectScene(o,project,scope).scene,factor=Math.min(scale,20000/scene.width,20000/scene.height);return {...o,width:Math.max(40,scene.width*factor),height:Math.max(32,scene.height*factor)};};
 const add=(type,diagramType='tree')=>{
  const now=model.iso(),point=worldPoint(32,84,pose.current);let object=canvas.createObject({id:model.id('object'),boardId:board.id,type,x:point.x,y:point.y,text:type==='frame'?'Frame':type==='diagram'?'Brainstorm':'',now,zIndex:Math.min(100000,Math.max(0,...draft.objects.map(o=>o.zIndex))+1),...(type==='frame'?{width:640,height:400}:type==='diagram'?{width:640,height:400,diagramType,direction:'down',nodes:[{id:'w0',parent:null,name:'Brainstorm',hours:0},{id:'w1',parent:'w0',name:'First idea',hours:0}]}:{})});
  if(type==='diagram')object=fittedDiagram(object);
  if(perform({type:'add',objects:[object]})){setSelected([object.id]);setText(object.text);setPanel('');setMode('select');if(type==='diagram'||pose.current.scale<.6)navigate(readablePose([object],viewport,objectScene(object,project,scope)));}
 };
 const draw=points=>{const x=Math.min(...points.map(p=>p.x)),y=Math.min(...points.map(p=>p.y)),right=Math.max(...points.map(p=>p.x)),bottom=Math.max(...points.map(p=>p.y));const o=canvas.createObject({id:model.id('stroke'),boardId:board.id,type:'draw',x,y,width:Math.max(40,right-x),height:Math.max(32,bottom-y),points:points.map(p=>({x:p.x-x,y:p.y-y})),strokeWidth:brushWidth,color:brushColor,now:model.iso()});return perform({type:'add',objects:[o]});};
 const erase=async points=>{if(eraseBusy.current)return;eraseBusy.current=true;setErasing(true);try{const objects=current.current.objects,ids=[],radius=12/pose.current.scale;for(let i=0;i<objects.length;i+=16){ids.push(...erasedStrokeIds(objects.slice(i,i+16),points,radius));if(i+16<objects.length)await new Promise(resolve=>setTimeout(resolve,0));}if(!mounted.current)return;const existing=new Set(current.current.objects.filter(o=>o.type==='draw'&&!o.locked).map(o=>o.id)),remove=ids.filter(id=>existing.has(id));if(remove.length)perform({type:'remove',ids:remove});}finally{eraseBusy.current=false;if(mounted.current)setErasing(false);}};
 const travel=direction=>{const from=direction==='undo'?undo:redo,to=direction==='undo'?redo:undo;if(!from.current.length)return;const content=from.current.at(-1),next=canvas.changeBoard({...current.current,revision:expected.current},{type:'restore',content},model.iso());to.current=pushHistory(to.current,canvas.contentOf(current.current));from.current=from.current.slice(0,-1);commit(next,false);setSelected([]);};
 const object=draft.objects.find(o=>o.id===selected[0]),source=object?.sourceLink?readSource(project,object.sourceLink):null;
 const inspect=()=>{setText(object?.text||'');setPanel(object?'inspect':'objects');};
 const finishInline=(cancel=false)=>{const edit=inlineRef.current;if(!edit)return true;const latest=current.current.objects.find(o=>o.id===edit.id);if(cancel||!latest||latest.locked){setInline(null);return true;}
  const node=edit.nodeId&&latest.nodes?.find(n=>n.id===edit.nodeId),before=node?(node.id==='w0'?latest.text||node.name:node.name):latest.text;
  if(edit.nodeId&&!node){setInline(null);return true;}if(edit.value===before){setInline(null);return true;}
  const patch=edit.nodeId?{nodes:latest.nodes.map(n=>n.id===edit.nodeId?{...n,name:edit.value}:n),...(edit.nodeId==='w0'?{text:edit.value}:{})}:{text:edit.value};
  if(latest.type==='diagram'){const next=fittedDiagram({...latest,...patch},objectScene(latest,project,scope).scale||1);patch.width=next.width;patch.height=next.height;}
  setInline(null);return perform({type:'patch',id:edit.id,patch});
 };
 const focusEdit=target=>{const b=target.box,scale=Math.max(.05,Math.min(2,(viewport.width-48)/b.width,(viewport.height*.5)/b.height));navigate({scale,x:(viewport.width-b.width*scale)/2-b.x*scale,y:Math.max(24,viewport.height*.2)-b.y*scale});};
 useEffect(()=>{if(inlineRef.current)focusEdit(inlineRef.current);},[viewport.width,viewport.height]);
 const editObject=(id,point)=>{const o=current.current.objects.find(o=>o.id===id);if(!o)return;setEdgeId('');setSelected([id]);const target=localEditTarget(o,objectScene(o,project,scope),point);if(target){setPanel('');focusEdit(target);setInline(target);}else if(o.type!=='diagram'){setText(o.text||'');setPanel('inspect');}};
 const editEdge=id=>{setSelected([]);setEdgeId(id);setText(current.current.connectors.find(e=>e.id===id)?.label||'');setPanel('connector');};
 const edge=draft.connectors.find(e=>e.id===edgeId);
 const deleteSelection=()=>{if(perform({type:'remove',ids:selected})){setSelected([]);setPanel('');}};
 const patch=changes=>{if(!object)return false;let patch=changes;if(object.type==='diagram'&&('diagramType' in changes||'direction' in changes||'nodes' in changes||'text' in changes)||object.type==='linked'&&changes.sourceLink&&['wbs','taskDiagram'].includes(changes.sourceLink.sourceType)){const previous=objectScene(object,project,scope),next=fittedDiagram({...object,...changes},previous.scale||1);patch={...changes,width:next.width,height:next.height};}return perform({type:'patch',id:object.id,patch});};

 const options=useMemo(()=>panel==='source'?sourceOptions(project).filter(o=>`${o.title} ${o.sourceType}`.toLowerCase().includes(query.toLowerCase())):[],[project,query,panel]);
 const insert=option=>{
  const now=model.iso(),point=worldPoint(32,84,pose.current);let link={...option,view:option.view||'tree',direction:'down'};
  if(snapshot)link=captureSource(project,link,now);const value=readSource(project,link);if(!value.available)throw Error(value.lines[0]||'Source unavailable');
  let o=canvas.createObject({id:model.id('object'),boardId:board.id,type:'linked',sourceLink:link,x:point.x,y:point.y,now,...(value.kind==='diagram'?{width:800,height:480}:value.kind==='roadmap'?{width:800,height:Math.max(240,Math.min(20000,80+value.tasks.length*44))}:{width:280,height:200})});
  if(value.kind==='diagram'){const layout=objectScene(o,project,scope).scene,factor=Math.min(1,20000/layout.width,20000/layout.height);o={...o,width:Math.max(40,layout.width*factor),height:Math.max(32,layout.height*factor)};}
  if(perform({type:'add',objects:[o]})){setSelected([o.id]);setPanel('');setMode('select');if(value.kind==='diagram')navigate(readablePose([o],viewport,objectScene(o,project,scope)));}
 };
 const copySelected=()=>{if(!selected.length)return;try{const incoming=canvas.duplicateBoard(canvas.selectionBoard(draft,selected),{id:board.id,now:model.iso(),nextId:()=>model.id('item')}),content=canvas.contentOf(draft);content.objects.push(...incoming.objects.map(o=>({...o,x:o.x+32,y:o.y+32})));content.connectors.push(...incoming.connectors);content.threads.push(...incoming.threads);if(perform({type:'restore',content}))setSelected(incoming.objects.map(o=>o.id));}catch(e){setError(e.message);}};
 const copyToClipboard=async()=>{try{await require('expo-clipboard').setStringAsync(canvas.exportBoard(canvas.selectionBoard(draft,selected)));setStatus('Selection copied');}catch(e){setError(e.message);}};

 const pasteClipboard=async()=>{try{const raw=await require('expo-clipboard').getStringAsync();if(!mounted.current)return;const incoming=canvas.importBoard(raw,{id:model.id('paste'),projectId:project.id,now:model.iso(),nextId:()=>model.id('item')}),content=canvas.contentOf(current.current);content.objects.push(...incoming.objects.map(o=>({...o,boardId:board.id,x:o.x+32,y:o.y+32})));content.connectors.push(...incoming.connectors);content.threads.push(...incoming.threads);if(perform({type:'restore',content}))setSelected(incoming.objects.map(o=>o.id));}catch(e){setError('Canvas paste failed: '+e.message);}};
 const group=()=>{if(!selected.length)return;const now=model.iso(),objects=draft.objects.filter(o=>selected.includes(o.id));if(objects.some(o=>o.locked)){setError('Unlock the objects before grouping');return;}const b=objectBounds(objects),id=model.id('frame');const frame=canvas.createObject({id,boardId:board.id,type:'frame',text:'Group',x:b.x,y:b.y,width:b.width,height:b.height,zIndex:0,now});const content=canvas.contentOf(draft);content.objects=[frame,...content.objects.map(o=>selected.includes(o.id)?{...o,groupId:id}:o)];if(perform({type:'restore',content}))setSelected([id]);};
 const openSource=async()=>{if(!object?.sourceLink||!source?.available||object.sourceLink.originProjectId&&object.sourceLink.originProjectId!==project.id)return;if(!await persistView())return;const type=object.sourceLink.sourceType;if(type==='taskDiagram')go('tasks');else if(type==='task')openTask(object.sourceLink.sourceId);else if(type==='roadmap')go('timeline');else if(type==='sprint')go('sprints');else openProject(project.id,type==='wbs'?'wbs':type==='risk'?'risks':type==='stakeholder'?'stakeholders':type==='document'?object.sourceLink.sourceId:'overview');};
 const addComment=()=>{if(!reply.trim())return;const now=model.iso(),point=worldPoint(80,80,pose.current);if(perform({type:'thread',thread:{id:model.id('thread'),objectId:selected[0]||'',x:point.x,y:point.y,messages:[{id:model.id('message'),authorId:canvas.LOCAL_OWNER,text:reply.trim(),at:now}]}}))setReply('');};
 const tool=next=>{if(!finishInline())return;const state=changeTool(mode,next);setMode(state.mode);setPanel(value=>value===state.panel?'':state.panel);};
 useBackDismiss(panel==='add',()=>setPanel(''),30);
 const closeHeader=useRef(close);closeHeader.current=close;
 const headerControls=useMemo(()=>({canvas:true,title:draft.title,onBack:()=>closeHeader.current(),trailing:<View style={{flexDirection:'row',alignItems:'center'}}><Button label={`${Math.round(zoom*100)}%`} variant="ghost" onPress={()=>setPanel('view')}/><IconBtn icon="maximize" label="Fit all Canvas objects" onPress={()=>navigate(fitPose(current.current.objects,viewport))}/></View>}),[draft.title,zoom,viewport]);
 useHeaderActions('canvas',headerControls);
 const feedback=error?<T color={c.danger} accessibilityRole="alert">{error}</T>:null;
 const keyHandler=useRef(null);keyHandler.current=e=>{if(/INPUT|TEXTAREA/.test(e.target?.tagName)||e.target?.isContentEditable)return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();travel(e.shiftKey?'redo':'undo');}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='c'&&selected.length){e.preventDefault();void copyToClipboard();}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='v'){e.preventDefault();void pasteClipboard();}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='d'){e.preventDefault();copySelected();}else if(e.key==='Delete'&&edgeId){e.preventDefault();perform({type:'disconnect',id:edgeId});setEdgeId('');setPanel('');}else if(e.key==='Delete'&&selected.length){e.preventDefault();perform({type:'remove',ids:selected});setSelected([]);}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)&&selected.length){e.preventDefault();move(selected,e.key==='ArrowLeft'?-8:e.key==='ArrowRight'?8:0,e.key==='ArrowUp'?-8:e.key==='ArrowDown'?8:0);}else if(e.key==='Escape'){finishInline(true);setPanel('');setSelected([]);}else if(!e.ctrlKey&&!e.metaKey&&!e.altKey&&['v','h','d','c','a'].includes(e.key.toLowerCase())){e.preventDefault();tool({v:'select',h:'pan',d:'draw',c:'connect',a:'add'}[e.key.toLowerCase()]);}else if(e.key==='0')navigate(fitPose(draft.objects,viewport));};
 useEffect(()=>{if(Platform.OS!=='web')return;const handler=e=>keyHandler.current(e);window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler);},[]);
 return <View style={{flex:1,backgroundColor:c.bg}}>
  {error||storageError?<View style={{padding:12,gap:8}}><T color={c.danger} size={12} accessibilityRole="alert">{error||storageError}</T><Button label="Retry save" variant="secondary" onPress={retry}/></View>:null}
  <View style={{flex:1,minHeight:160,overflow:'hidden'}} onLayout={e=>{const {width,height}=e.nativeEvent.layout;if(width>0&&height>0){setInitialPose(pose.current);setViewport(old=>old.width===width&&old.height===height?old:{width,height});}}}>
   <CanvasSurface board={draft} project={project} scope={scope} selected={selected} mode={mode} viewport={viewport} request={request} initialPose={initialPose} onSelect={select} onMove={move} onDraw={draw} onErase={erase} brushWidth={brushWidth} brushColor={brushColor} onPose={setPose} onPreviewPose={value=>{pose.current=value;}} onEditObject={editObject} onEditEdge={editEdge} onResize={resize} onConnect={connect} onStartConnect={startConnect} onInteractionStart={()=>{if(panel==='add')setPanel('');}}/>
   {inlineEdit?<CanvasInlineEditor key={`${inlineEdit.id}:${inlineEdit.nodeId}`} edit={inlineEdit} pose={pose.current} viewport={viewport} onChange={value=>{if(inlineRef.current)inlineRef.current={...inlineRef.current,value};}} onDone={()=>finishInline()} onCancel={()=>finishInline(true)}/>:null}
   {!draft.objects.length?<View pointerEvents="none" style={{position:'absolute',left:32,right:32,top:48,gap:8}}><T size={22} weight="500">Space for the next idea</T><T muted>Add a note, bring in a project source, or start drawing</T></View>:null}
   {!inlineEdit?<>
    <CanvasToolbar mode={mode} panel={panel} onTool={tool} onUndo={()=>travel('undo')} onRedo={()=>travel('redo')} canUndo={!!undo.current.length} canRedo={!!redo.current.length}/>
    {!panel&&mode!=='draw'&&mode!=='erase'?<CanvasContextToolbar object={object} count={selected.length} onEdit={()=>editObject(object.id)} onColor={color=>patch({color})} onDuplicate={copySelected} onConnect={()=>startConnect(object.id)} onMore={()=>setPanel('selection')} onGroup={group} onDelete={deleteSelection} onLayout={()=>setPanel('diagram')} sourceAvailable={!!source?.available&&(!object.sourceLink.originProjectId||object.sourceLink.originProjectId===project.id)} onSource={openSource} onWidth={()=>setPanel('appearance')}/>:null}
    {panel==='add'?<CanvasAddMenu height={viewport.height} bottom={84} onClose={()=>setPanel('')} onAdd={add} onSource={()=>setPanel('source')} onProjectDiagram={()=>{setDiagramSource('taskDiagram');setPanel('project-diagram');}}/>:null}
    {mode==='multi'?<View style={{position:'absolute',top:12,left:12}}><Button label="Done selecting" icon="check" variant="secondary" onPress={()=>tool('select')}/></View>:null}
    {mode==='draw'||mode==='erase'?<View style={{position:'absolute',top:12,left:12}}><Button label={mode==='erase'?'Eraser options':'Brush options'} icon="sliders" variant="secondary" onPress={()=>setPanel('drawing')}/></View>:null}
   </>:null}
  </View>
  {panel==='view'?<Sheet visible title="Canvas view" compact onClose={()=>setPanel('')}>
   <Button label="Fit selection" icon="maximize" disabled={!selected.length} onPress={()=>{navigate(fitPose(canvas.selectionBoard(draft,selected).objects,viewport));setPanel('');}}/>
   <Button label="Fit all Canvas objects" icon="maximize" onPress={()=>{navigate(fitPose(draft.objects,viewport));setPanel('');}}/>
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}><Button label="Zoom out Canvas" variant="secondary" onPress={()=>navigate(zoomAt(pose.current,.8,{x:viewport.width/2,y:viewport.height/2}))}/><Button label="Zoom in Canvas" variant="secondary" onPress={()=>navigate(zoomAt(pose.current,1.25,{x:viewport.width/2,y:viewport.height/2}))}/><Button label="Reset to 100%" variant="secondary" onPress={()=>navigate({scale:1,x:32,y:32})}/></View>
   <Fold title="Pan with buttons">{[['Left',120,0],['Right',-120,0],['Up',0,120],['Down',0,-120]].map(([label,x,y])=><Button key={label} label={label} variant="secondary" onPress={()=>navigate({...pose.current,x:pose.current.x+x,y:pose.current.y+y})}/>)}</Fold>
  </Sheet>:null}
  {panel==='drawing'?<Sheet visible title="Drawing tools" compact onClose={()=>setPanel('')}>
   <View style={{gap:0}}><T size={12} muted>Tool</T><CanvasMenuRow label="Brush" icon="edit-2" selected={mode==='draw'} detail="Draw freehand strokes" onPress={()=>setMode('draw')}/><CanvasMenuRow label="Eraser" icon="delete" selected={mode==='erase'} detail="Remove touched drawing strokes · Undo restores them" onPress={()=>setMode('erase')}/></View>
   <View style={{gap:8}}><T size={12} muted>Stroke width</T><Segmented options={[1,3,6,12,24].map(value=>({value,label:`${value}`}))} value={brushWidth} onChange={setBrushWidth}/></View>
   <View style={{gap:0}}><T size={12} muted>Ink</T><CanvasSwatches value={brushColor} onChange={setBrushColor}/></View>
   <Button label={mode==='erase'?'Start erasing':'Start drawing'} onPress={()=>{if(mode!=='erase')setMode('draw');setPanel('');}}/>{erasing?<T muted accessibilityLiveRegion="polite">Erasing strokes…</T>:null}
  </Sheet>:null}
  {panel==='tools'?<Sheet visible title="Canvas tools" compact onClose={()=>setPanel('')}>
   <View style={{gap:8}}><T size={12} muted>Edit</T><CanvasMenuRow label="Select multiple" icon="check-square" selected={mode==='multi'} onPress={()=>{setMode(mode==='multi'?'select':'multi');setPanel('');}}/><CanvasMenuRow label="Pan mode" icon="move" selected={mode==='pan'} onPress={()=>{setMode('pan');setPanel('');}}/><CanvasMenuRow label="Selection actions" icon="mouse-pointer" onPress={()=>setPanel('selection')}/></View>
   <View style={{gap:0}}><T size={12} muted style={{marginBottom:8}}>Explore</T><CanvasMenuRow label="Objects" icon="layers" onPress={()=>setPanel('objects')}/><CanvasMenuRow label="Connections" icon="git-merge" onPress={()=>setPanel('connections')}/><CanvasMenuRow label="Comments" icon="message-circle" onPress={()=>setPanel('comments')}/></View>
   <View style={{gap:0}}><T size={12} muted style={{marginBottom:8}}>Board</T><CanvasMenuRow label="Board settings" icon="settings" onPress={()=>setPanel('settings')}/><CanvasMenuRow label="Export and backup" icon="download" onPress={()=>setPanel('export')}/></View><T muted size={12} accessibilityLiveRegion="polite">{status}</T>
  </Sheet>:null}
  {panel==='selection'?<Sheet visible title="Selection actions" compact onClose={()=>setPanel('tools')}>
   {object?<><CanvasMenuRow label="Object properties" icon="sliders" onPress={inspect}/><CanvasMenuRow label="Arrange and resize" icon="move" onPress={()=>setPanel('arrange')}/>{object.type==='diagram'||['wbs','taskDiagram'].includes(object.sourceLink?.sourceType)?<CanvasMenuRow label="Diagram layout and branches" icon="git-branch" onPress={()=>setPanel('diagram')}/>:null}</>:null}
   <Button label="Align left" variant="secondary" disabled={selected.length<2} onPress={()=>{const left=Math.min(...draft.objects.filter(o=>selected.includes(o.id)).map(o=>o.x)),content=canvas.contentOf(draft);if(content.objects.some(o=>selected.includes(o.id)&&o.locked)){setError('Unlock the selection first');return;}content.objects=content.objects.map(o=>selected.includes(o.id)?{...o,x:left}:o);perform({type:'restore',content});}}/>
   <CanvasMenuRow label="Copy" icon="copy" disabled={!selected.length} onPress={copyToClipboard}/><CanvasMenuRow label="Paste" icon="clipboard" onPress={pasteClipboard}/><CanvasMenuRow label="Duplicate" icon="copy" disabled={!selected.length} onPress={copySelected}/><CanvasMenuRow label="Group" icon="layers" disabled={!selected.length} onPress={group}/><CanvasMenuRow label="Delete selection" icon="trash-2" danger disabled={!selected.length} onPress={deleteSelection}/>
  </Sheet>:null}
  {panel==='export'?<Sheet visible title="Export Canvas" compact onClose={()=>setPanel('tools')}><CanvasExports board={draft} project={project} scope={scope}/></Sheet>:null}
  {panel==='project-diagram'?<Sheet visible title={diagramSource==='wbs'?'WBS diagram':'Project task diagram'} compact onClose={()=>setPanel('')}>
   {feedback}<T muted size={13}>{diagramSource==='wbs'?'Uses work elements from Project Artifacts → WBS':'Uses project tasks and their parent/subtask links'}</T>
   {diagramSource==='taskDiagram'&&!project.tasks.length?<T muted>Add tasks to this project first</T>:null}
   {['tree','fishbone','mind'].map(view=><CanvasMenuRow key={view} icon={view==='mind'?'share-2':'git-branch'} label={view==='tree'?'Project Tree':view==='fishbone'?'Project Fishbone':'Project Mind Map'} disabled={diagramSource==='taskDiagram'&&!project.tasks.length} onPress={()=>{try{insert({sourceType:diagramSource,sourceId:diagramSource==='wbs'?'w0':project.id,projectId:project.id,mode:'live',view});}catch(e){setError(e.message);}}}/>)}
  </Sheet>:null}
  {panel==='source'?<Sheet visible title="Project sources" compact scrollable={false} onClose={()=>setPanel('')}>
   <CanvasSources options={options} query={query} onQuery={setQuery} snapshot={snapshot} onSnapshot={setSnapshot} error={error} onInsert={option=>{try{if(option.sourceType==='wbs'){setDiagramSource('wbs');setPanel('project-diagram');}else insert(option);}catch(e){setError(e.message);}}}/>
  </Sheet>:null}
  {panel==='inspect'?<Sheet visible title={object?'Canvas object':'Objects'} onClose={()=>setPanel('')}>
   {error?<T color={c.danger} accessibilityRole="alert">{error}</T>:null}
   {object?<>
    <T size={12} muted>{object.type}{object.locked?' · Locked':''}</T>
    {object.type!=='linked'&&object.type!=='draw'?<><Input value={text} onChangeText={setText} multiline accessibilityLabel="Canvas object text"/><Button label="Save text" disabled={object.locked} onPress={()=>patch({text})}/></>:object.type==='linked'?<><T>{source?.title}</T>{source?.lines?.map((s,i)=><T key={i} muted>{s}</T>)}<Button label="Open canonical source" disabled={!source?.available||!!object.sourceLink.originProjectId&&object.sourceLink.originProjectId!==project.id} onPress={openSource}/><Button label="Capture snapshot" variant="secondary" disabled={object.locked||!source?.available||object.sourceLink.mode==='snapshot'} onPress={()=>{try{patch({sourceLink:captureSource(project,object.sourceLink,model.iso())});}catch(e){setError(e.message);}}}/></>:null}
    {object.type!=='linked'&&object.type!=='draw'?<CanvasMenuRow label="Edit on canvas" icon="edit-3" disabled={object.locked} onPress={()=>editObject(object.id)}/>:null}
    <View style={{gap:0}}><T size={12} muted>Properties</T><CanvasMenuRow label="Arrange and resize" icon="move" onPress={()=>setPanel('arrange')}/>{object.type!=='diagram'&&!['wbs','taskDiagram'].includes(object.sourceLink?.sourceType)?<CanvasMenuRow label="Appearance" icon="sliders" onPress={()=>setPanel('appearance')}/>:null}{object.type==='diagram'||['wbs','taskDiagram'].includes(object.sourceLink?.sourceType)?<CanvasMenuRow label="Diagram layout and branches" icon="git-branch" onPress={()=>setPanel('diagram')}/>:null}</View>
    <Button label={selected.length>1?'Delete selected elements':'Delete element'} variant="danger" disabled={object.locked} onPress={deleteSelection}/>
   </>:null}
  </Sheet>:null}
  {panel==='arrange'?<Sheet visible title="Arrange and resize" onClose={()=>setPanel('inspect')}>{feedback}{object?<>

    <View style={{gap:0}}><T size={12} muted>Layer</T><CanvasMenuRow label={object.locked?'Unlock object':'Lock object'} icon={object.locked?'unlock':'lock'} onPress={()=>perform({type:'lock',id:object.id,locked:!object.locked})}/><CanvasMenuRow label="Bring to front" icon="chevrons-up" disabled={object.locked} onPress={()=>perform({type:'layer',id:object.id,front:true})}/><CanvasMenuRow label="Send to back" icon="chevrons-down" disabled={object.locked} onPress={()=>perform({type:'layer',id:object.id,front:false})}/><CanvasMenuRow label="Ungroup" icon="layers" disabled={object.locked||!object.groupId&&!draft.objects.some(o=>o.groupId===object.id)} onPress={()=>perform({type:'ungroup',id:object.id})}/></View>
    <T size={12} muted>Position and size</T><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{[['Left',-16,0],['Right',16,0],['Up',0,-16],['Down',0,16]].map(([label,dx,dy])=><Button key={label} label={label} variant="secondary" disabled={object.locked} onPress={()=>move(selected,dx,dy)}/>)}</View>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{[['Wider','width',32],['Narrower','width',-32],['Taller','height',32],['Shorter','height',-32]].map(([label,field,delta])=><Button key={label} label={label} variant="secondary" disabled={object.locked} onPress={()=>patch({[field]:object[field]+delta})}/>)}</View>
   </>:null}</Sheet>:null}
  {panel==='appearance'?<Sheet visible title="Appearance" compact onClose={()=>setPanel('inspect')}>{feedback}{object?<>
    {object.type==='draw'?<><T size={12} muted>Stroke width</T><Segmented options={[1,3,6,12,24].map(value=>({value,label:`${value}`}))} value={object.strokeWidth||2} onChange={strokeWidth=>patch({strokeWidth})}/></>:null}
    <T size={12} muted>Color</T><CanvasSwatches value={object.color} disabled={object.locked} onChange={color=>patch({color})}/>


   </>:null}</Sheet>:null}
  {panel==='diagram'?<Sheet visible title="Diagram layout and branches" onClose={()=>setPanel('inspect')}>{feedback}{object?<>
    {object.type==='diagram'?<><T size={12} muted>Layout</T><Segmented options={[{value:'tree',label:'Tree'},{value:'fishbone',label:'Fishbone'},{value:'mind',label:'Mind map'}]} value={object.diagramType} onChange={diagramType=>patch({diagramType})}/><CanvasMenuRow label="Add diagram branch" icon="plus" disabled={object.locked} onPress={()=>patch({nodes:[...object.nodes,{id:model.id('node'),parent:'w0',name:'New idea',hours:0}]})}/><T size={12} muted>Nodes</T>{object.nodes.slice(0,100).map(n=><CanvasMenuRow key={n.id} label={n.name} icon="git-branch" detail={n.id==='w0'?'Root':'Branch'} onPress={()=>{setNodeId(n.id);setPanel('node');}}/>)}{object.nodes.length>100?<T muted>Double-tap any other node on the canvas to edit it</T>:null}</>:null}

    {['wbs','taskDiagram'].includes(object.sourceLink?.sourceType)?<Segmented options={[{value:'tree',label:'Tree'},{value:'fishbone',label:'Fishbone'},{value:'mind',label:'Mind map'}]} value={object.sourceLink.view} onChange={view=>patch({sourceLink:{...object.sourceLink,view}})}/>:null}
    {(object.type==='diagram'&&object.diagramType==='tree'||['wbs','taskDiagram'].includes(object.sourceLink?.sourceType)&&object.sourceLink.view==='tree')?<Segmented options={[{value:'down',label:'Top-down'},{value:'right',label:'Left to right'}]} value={object.direction||object.sourceLink?.direction} onChange={direction=>object.type==='diagram'?patch({direction}):patch({sourceLink:{...object.sourceLink,direction}})}/>:null}
   </>:null}</Sheet>:null}
  {panel==='node'?<Sheet visible title={object?.nodes?.find(n=>n.id===nodeId)?.name||'Diagram node'} compact onClose={()=>setPanel('diagram')}>
   {feedback}<CanvasMenuRow label="Edit node on canvas" icon="edit-3" disabled={object?.locked} onPress={()=>{const target=object&&localEditTarget(object,objectScene(object,project,scope),null,nodeId);if(target){setPanel('');focusEdit(target);setInline(target);}}}/><CanvasMenuRow label="Add child node" icon="plus" disabled={object?.locked} onPress={()=>{if(patch({nodes:[...object.nodes,{id:model.id('node'),parent:nodeId,name:'New idea',hours:0}]}))setPanel('diagram');}}/>{nodeId!=='w0'?<CanvasMenuRow label="Delete node and branches" icon="trash-2" danger disabled={object?.locked} onPress={()=>{if(patch({nodes:wbsDelete(object.nodes,nodeId)}))setPanel('diagram');}}/>:null}
  </Sheet>:null}
  {panel==='objects'?<Sheet visible title="Objects and selection" onClose={()=>setPanel('')}>
   <T muted size={12}>Select multiple objects here to align, group or move them together</T>
   <View style={{gap:0}}><CanvasMenuRow label="Select all" icon="check-square" onPress={()=>setSelected(draft.objects.filter(o=>!o.locked).map(o=>o.id))}/><CanvasMenuRow label="Selection actions" icon="mouse-pointer" detail="Copy, duplicate, group or delete" onPress={()=>setPanel('selection')}/></View>

   <Input value={objectQuery} onChangeText={setObjectQuery} placeholder="Find a Canvas object" accessibilityLabel="Find a Canvas object"/>
   {draft.objects.filter(o=>`${o.text} ${o.type} ${o.sourceLink?readSource(project,o.sourceLink).title:''}`.toLowerCase().includes(objectQuery.toLowerCase())).slice(0,100).map(o=><CanvasMenuRow key={o.id} icon="square" selected={selected.includes(o.id)} label={o.text||(o.sourceLink?readSource(project,o.sourceLink).title:o.type)} detail={o.type} onPress={()=>{setSelected(ids=>ids.includes(o.id)?ids.filter(id=>id!==o.id):[...ids,o.id]);setText(o.text);}}/>)}
   <T muted size={12}>Tap a row to add/remove it from selection. Use Edit for the first selected object.</T><Button label="Edit selected object" disabled={!selected.length} onPress={inspect}/>
  </Sheet>:null}
  {panel==='connections'?<Sheet visible title="Connections" onClose={()=>setPanel('')}>
   {!draft.connectors.length?<T muted>Choose Connect, then tap two objects</T>:null}
   {draft.connectors.map(e=><CanvasMenuRow key={e.id} icon="git-merge" label={e.label||`${draft.objects.find(o=>o.id===e.from)?.text||'Object'} → ${draft.objects.find(o=>o.id===e.to)?.text||'Object'}`} onPress={()=>editEdge(e.id)}/>)}
  </Sheet>:null}
  {panel==='connector'?<Sheet visible title="Edit connector" compact onClose={()=>setPanel('')}>
   {feedback}
   {edge?<><Input value={text} accessibilityLabel="Connection label" onChangeText={setText}/><Button label="Save connector label" onPress={()=>perform({type:'editConnector',id:edge.id,patch:{label:text}})}/>
    <Segmented options={[{value:'curve',label:'S-curve'},{value:'straight',label:'Straight'},{value:'elbow',label:'Elbow'}]} value={edge.style} onChange={style=>perform({type:'editConnector',id:edge.id,patch:{style,label:text}})}/>
    <Button label="Delete connector" variant="danger" onPress={()=>{if(perform({type:'disconnect',id:edge.id})){setEdgeId('');setPanel('');}}}/><T muted size={12}>Undo restores a deleted line. Source objects stay in place.</T>
   </>:null}
  </Sheet>:null}
  {panel==='comments'?<Sheet visible title="Canvas comments" onClose={()=>setPanel('')}>
   {feedback}
   <T muted size={12}>{selected.length?'New comments attach to the selected object':'New comments attach to the current board position'}</T><Input value={reply} onChangeText={setReply} multiline accessibilityLabel="Canvas comment"/><Button label="Add comment" disabled={!reply.trim()} onPress={addComment}/>
   {draft.threads.slice(0,commentLimit).map(thread=><View key={thread.id} style={{gap:8,paddingVertical:12,borderBottomWidth:1,borderColor:c.line}}><T size={12} muted>{thread.resolvedAt?'Resolved':'Open'} · {thread.objectId?'Object comment':'Board comment'}</T>{thread.messages.map(m=><T key={m.id}>{m.text}</T>)}<Input accessibilityLabel="Reply to Canvas thread" value={threadReplies[thread.id]||''} onChangeText={value=>setThreadReplies(values=>({...values,[thread.id]:value}))}/><Button label="Send reply" disabled={!threadReplies[thread.id]?.trim()} onPress={()=>{const text=threadReplies[thread.id]?.trim();if(text&&perform({type:'reply',id:thread.id,message:{id:model.id('reply'),text,at:model.iso()}}))setThreadReplies(values=>({...values,[thread.id]:''}));}}/><Button label={thread.resolvedAt?'Reopen thread':'Resolve thread'} variant="secondary" onPress={()=>perform({type:'resolve',id:thread.id,resolved:!thread.resolvedAt})}/></View>)}
   {draft.threads.length>commentLimit?<Button label="More comments" variant="secondary" onPress={()=>setCommentLimit(value=>value+20)}/>:null}
  </Sheet>:null}
  {panel==='settings'?<Sheet visible title="Canvas options" onClose={()=>setPanel('')}>
   {feedback}
   <Input value={title} onChangeText={setTitle} accessibilityLabel="Canvas title"/><Button label="Rename canvas" onPress={()=>perform({type:'rename',title:title.trim()})}/>
   <Button label="Invite / share (unavailable)" disabled variant="secondary"/><T muted>Boards are private on this device. Viewer/Editor sharing needs authenticated server enforcement in Milvayo's own backend.</T>
   <T muted size={12}>Undo/redo changes Canvas content only. Dragging links does not change canonical tasks, dates, risks or WBS.</T>
  </Sheet>:null}
 </View>;
}
