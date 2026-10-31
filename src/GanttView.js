import React, {useMemo,useRef,useState,useEffect} from 'react';
import {View,Text,ScrollView,Pressable,Modal,PanResponder,Platform,useWindowDimensions} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import Svg,{Path,Circle} from 'react-native-svg';
import model from './model.cjs';
import viewportMath from './viewport.cjs';
import design from './design.cjs';
const g=model.gantt;
const K=design.colors;
const HEADER=60;
const zoomLevels={Days:48,Weeks:24,Months:10};
const statusColor={Backlog:'#a2a2ae',get 'In progress'(){return K.purple},Validation:K.amber,Done:K.green};
const weekday=new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone:'UTC'});
const monthLabel=new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric',timeZone:'UTC'});
const dayLabel=new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'});
function T({children,size=12,color=K.ink,bold=false,style={},lines}){return <Text numberOfLines={lines} style={[{fontSize:size,color,fontWeight:bold?'600':'400'},style]}>{children}</Text>}
function Icon({name,size=16,color=K.muted}){return <Ionicons name={name} size={size} color={color}/>}
function Control({label,onPress,selected=false,icon,disabled=false}){return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={({pressed})=>({paddingHorizontal:12,minHeight:40,paddingVertical:8,borderWidth:1,borderRadius:8,borderColor:selected?K.accentBorder:K.border,backgroundColor:selected?K.purpleDim:K.panel,opacity:disabled?.4:pressed?.7:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6})}>{icon&&<Icon name={icon} color={selected?K.purple:K.muted}/>}<T size={12} color={selected?K.purple:K.ink} bold={selected}>{label}</T></Pressable>}
function InteractiveBar({task,geometry,row,color,dayWidth,onOpen,onMove,onResize,onLinkStart,onLinkPointer,onLinkFinish,onTargetTap,isCritical,linkActive}){
 const [preview,setPreview]=useState({dx:0,end:0});
 const liveDayWidth=useRef(dayWidth);liveDayWidth.current=dayWidth;
 const handlers=useRef({onMove,onResize,onLinkStart,onLinkPointer,onLinkFinish,onTargetTap});handlers.current={onMove,onResize,onLinkStart,onLinkPointer,onLinkFinish,onTargetTap};
 const drag=useRef(PanResponder.create({onStartShouldSetPanResponder:()=>true,onMoveShouldSetPanResponder:()=>true,onPanResponderTerminationRequest:()=>false,
  onPanResponderMove:(_,p)=>setPreview(s=>({...s,dx:p.dx})),
  onPanResponderRelease:(_,p)=>{setPreview(s=>({...s,dx:0}));if(handlers.current.onTargetTap(task.id,Math.abs(p.dx)+Math.abs(p.dy)<9))return;const days=Math.round(p.dx/liveDayWidth.current);if(days)handlers.current.onMove(task.id,days)},
  onPanResponderTerminate:()=>setPreview(s=>({...s,dx:0}))})).current;
 const resizer=useRef(PanResponder.create({onStartShouldSetPanResponder:()=>true,onMoveShouldSetPanResponder:()=>true,onPanResponderTerminationRequest:()=>false,
  onPanResponderMove:(_,p)=>setPreview(s=>({...s,end:p.dx})),
  onPanResponderRelease:(_,p)=>{setPreview(s=>({...s,end:0}));const days=Math.round(p.dx/liveDayWidth.current);if(days)handlers.current.onResize(task.id,days)},
  onPanResponderTerminate:()=>setPreview(s=>({...s,end:0}))})).current;
 const connector=useRef(PanResponder.create({
  onStartShouldSetPanResponder:()=>true,onMoveShouldSetPanResponder:()=>true,
  onPanResponderTerminationRequest:()=>false,
  onPanResponderGrant:(_,p)=>handlers.current.onLinkStart(task.id,p.x0,p.y0),
  onPanResponderMove:(_,p)=>handlers.current.onLinkPointer(task.id,p.dx,p.dy,p.moveX,p.moveY),
  onPanResponderRelease:(_,p)=>handlers.current.onLinkFinish(task.id,p.dx,p.dy,Math.abs(p.dx)+Math.abs(p.dy)<10),
  onPanResponderTerminate:()=>handlers.current.onLinkFinish(task.id,null,null,true)
 })).current;
 const barWidth=Math.max(22,geometry.width-5+preview.end);
 if(dayWidth<14&&!geometry.milestone)return <Pressable accessibilityRole="button" accessibilityLabel={`Open ${task.title}; zoom in to edit its dates`} onPress={()=>onOpen(task.id)} style={{position:'absolute',left:geometry.x+1,top:row.top+22,height:14,width:Math.max(4,geometry.width-2),backgroundColor:color,borderRadius:3,opacity:.9}}/>;
 if(geometry.milestone)return <View style={{position:'absolute',left:geometry.x+dayWidth/2-12,top:row.top+11,height:36,width:52,zIndex:4,flexDirection:'row',alignItems:'center'}}><Pressable accessibilityLabel={`Open milestone ${task.title}`} onPress={()=>{if(!handlers.current.onTargetTap(task.id,true))onOpen(task.id)}} style={{width:20,height:20,transform:[{rotate:'45deg'}],backgroundColor:color,borderWidth:isCritical?3:2,borderColor:isCritical?K.amber:K.ink,borderRadius:2}}/><View {...connector.panHandlers} accessibilityLabel={`Connect milestone ${task.title} to a successor`} style={{marginLeft:6,width:24,height:32,justifyContent:'center',alignItems:'center'}}><Icon name="git-commit-outline" size={19} color={linkActive?K.amber:K.cyan}/></View></View>;
 return <View style={{position:'absolute',left:geometry.x+2+preview.dx,top:row.top+11,width:barWidth,height:36,backgroundColor:color,borderRadius:7,borderWidth:isCritical?2:1,borderColor:isCritical?K.amber:'#ffffff44',zIndex:3,flexDirection:'row',alignItems:'center',overflow:'hidden'}}>
  <View {...drag.panHandlers} accessibilityLabel={`Move ${task.title}; ${geometry.days} days`} style={{flex:1,height:36,justifyContent:'center',paddingLeft:9,paddingRight:3,...(Platform.OS==='web'?{cursor:'grab',userSelect:'none'}:{})}}><T size={11} color={K.bg} bold lines={1}>{barWidth>92?task.title:barWidth>52?task.id:''}</T></View>
  {barWidth>126&&<Pressable onPress={()=>onOpen(task.id)} accessibilityLabel={`Edit ${task.title}`} style={{padding:4}}><Icon name="open-outline" size={13} color={K.bg}/></Pressable>}
  <View {...connector.panHandlers} accessible accessibilityLabel={`Connect ${task.title} to a successor`} style={{width:24,height:36,justifyContent:'center',alignItems:'center',backgroundColor:linkActive?'#152b32':'#14182111'}}><Icon name="git-commit-outline" size={17} color={linkActive?K.amber:K.bg}/></View>
  <View {...resizer.panHandlers} accessible accessibilityLabel={`Resize end of ${task.title}`} style={{height:36,width:16,backgroundColor:'#00000033',justifyContent:'center',alignItems:'center',...(Platform.OS==='web'?{cursor:'ew-resize'}:{})}}><View style={{width:3,height:14,borderRadius:2,backgroundColor:'#17181e88'}}/></View>
 </View>;
}
// Dependencies are rendered as independent curved strokes. The 18px
// invisible stroke increases tap tolerance without painting over the chart.
function Dependency({path,critical=false,selected=false,onSelect}){
 const color=path.conflict?K.red:critical?K.amber:K.cyan;
 const d=g.dependencyCurve(path);
 return <React.Fragment>
  <Path d={d} fill="none" stroke={K.bg} strokeWidth={selected?5:4.5} strokeLinecap="round" strokeLinejoin="round" opacity={.95}/>
  <Path d={d} fill="none" stroke={color} strokeWidth={selected?3:2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={path.conflict?"5 4":undefined} opacity={selected?1:.82}/>
  <Path d={d} fill="none" stroke={color} strokeOpacity={0.001} strokeWidth={20} onPress={onSelect} accessibilityLabel={`Open dependency from ${path.fromId} to ${path.toId}`}/>
  <Circle cx={path.x1} cy={path.y1} r={selected?4:3} fill={color}/>
  <Path d={`M ${path.x2-9} ${path.y2-5} L ${path.x2-1} ${path.y2} L ${path.x2-9} ${path.y2+5} Z`} fill={color}/>
 </React.Fragment>;
}
export default function GanttView({project,onOpen,onMove,onResize,onSchedule,onLink,onAlign,onSampleSchedule}){
 const {height:screenHeight}=useWindowDimensions();
 const [width,setWidth]=useState(380),[dayWidth,setDayWidth]=useState(zoomLevels.Weeks),[mode,setMode]=useState('status'),[collapsed,setCollapsed]=useState([]),[linkTask,setLinkTask]=useState(null),[linkError,setLinkError]=useState(''),[calendarOffset,setCalendarOffset]=useState(0),[linkSource,setLinkSource]=useState(null),[linkPreview,setLinkPreview]=useState(null),[showCritical,setShowCritical]=useState(false),[selectedLink,setSelectedLink]=useState(null),[showHelp,setShowHelp]=useState(false),[showScheduleIssues,setShowScheduleIssues]=useState(false),[showLinks,setShowLinks]=useState(false),[isLinkDragging,setIsLinkDragging]=useState(false),[pinchActive,setPinchActive]=useState(false);
 const zoom=dayWidth>=36?'Days':dayWidth>=17?'Weeks':'Months';
 const now=new Date().toISOString().slice(0,10);
 const base=useMemo(()=>g.calendarDomain(project.tasks,now),[project.tasks,now]);
 const day0=base.from+calendarOffset;
 const days=Array.from({length:base.count},(_,i)=>g.dateAt(day0+i));
 const rows=useMemo(()=>g.layoutRows(mode==='hierarchy'?g.hierarchyRows(project.tasks,collapsed):g.buildRows(project.tasks,mode),HEADER),[project.tasks,mode,collapsed]);
 const rollups=useMemo(()=>model.planning.progressRollups(project.tasks),[project.tasks]);
 const summaries=useMemo(()=>g.hierarchySummaries(project.tasks,rollups),[project.tasks,rollups]);
 useEffect(()=>setCollapsed([]),[project.id]);
 const totalHeight=rows.length?rows[rows.length-1].top+rows[rows.length-1].height:HEADER+85;
 const canvasWidth=base.count*dayWidth;
 const labelsWidth=Math.max(124,Math.min(220,Math.round(width*(width<550?.34:.30))));
 const scroll=useRef(null), vertical=useRef(null), viewport=useRef(null);
 const offsets=useRef({x:0,y:0}), viewportRect=useRef(null), viewportSize=useRef({width:0,height:0});
 const linkSession=useRef(null), autoTimer=useRef(null), pinch=useRef(null), zoomAnchor=useRef(null);
 const totalHeightRef=useRef(totalHeight),canvasWidthRef=useRef(canvasWidth);totalHeightRef.current=totalHeight;canvasWidthRef.current=canvasWidth;
 const viewportHeight=Math.max(296,Math.min(580,screenHeight-(Platform.OS==='web'?250:360)));
 const measureViewport=()=>viewport.current?.measureInWindow?.((x,y,w,h)=>{viewportRect.current={x,y,width:w,height:h};viewportSize.current={width:w,height:h}});
 const scrollXTo=(value)=>{const x=viewportMath.clamp(value,0,Math.max(0,canvasWidthRef.current-Math.max(0,viewportSize.current.width-labelsWidth)));offsets.current.x=x;scroll.current?.scrollTo({x,animated:false})};
 const scrollYTo=(value)=>{const y=viewportMath.clamp(value,0,Math.max(0,totalHeightRef.current-viewportSize.current.height));offsets.current.y=y;vertical.current?.scrollTo({y,animated:false})};
 const pinchStart=e=>{if(Platform.OS==='web')return;const touches=e.nativeEvent.touches||[];if(touches.length!==2)return;const d=viewportMath.touchDistance(touches);if(!d)return;
  const rect=viewportRect.current;const centerX=(touches[0].pageX+touches[1].pageX)/2-(rect?.x||0)-labelsWidth;
  pinch.current={distance:d,width:dayWidth,centerX,scrollX:offsets.current.x};setPinchActive(true);
  if(linkSession.current)cancelLinkDrag();
 };
 const pinchMove=e=>{const touches=e.nativeEvent.touches||[];if(touches.length<2)return;if(!pinch.current){pinchStart(e);return;}const d=viewportMath.touchDistance(touches);if(!d)return;
  const next=viewportMath.zoomWidth(pinch.current.width,d/pinch.current.distance);const offset=viewportMath.anchorScroll(pinch.current.scrollX,pinch.current.centerX,pinch.current.width,next);
  zoomAnchor.current=offset;setDayWidth(w=>Math.abs(w-next)<.3?w:next);
 };
 const pinchEnd=e=>{if((e.nativeEvent.touches||[]).length<2){pinch.current=null;setPinchActive(false)}};
 const changeZoom=(next)=>{zoomAnchor.current=viewportMath.anchorScroll(offsets.current.x,Math.max(0,(viewportSize.current.width-labelsWidth)/2),dayWidth,next);setDayWidth(next)};
 useEffect(()=>{if(zoomAnchor.current!==null){const x=zoomAnchor.current;zoomAnchor.current=null;scrollXTo(x)}},[dayWidth]);
 useEffect(()=>()=>{if(autoTimer.current)clearInterval(autoTimer.current)},[]);
 const scheduleHealth=useMemo(()=>{try{return model.projectScheduling.audit(project)}catch(e){return {issues:[{code:'invalid_schedule',detail:e.message}]}}},[project]);
 const conflicts=scheduleHealth.issues.filter(issue=>issue.code==='dependency_conflict');
 const scheduleWarnings=scheduleHealth.issues;
 const legacyCritical=project.scheduling?.calendar?.mode!=='workdays'&&!(project.scheduling?.links||[]).some(l=>l.type!=='FS'||l.lagDays!==0);
 const conflictIds=new Set(conflicts.map(x=>x.taskId));
 const invalidIds=new Set([...g.invalidSchedules(project.tasks),...scheduleWarnings.filter(e=>e.code!=='dependency_conflict'&&e.taskId).map(e=>e.taskId)]);
 const linkPaths=g.dependencyGeometry(rows,day0,dayWidth,project.scheduling?.links).map(path=>({...path,conflict:conflicts.some(c=>c.taskId===path.toId&&c.predecessorId===path.fromId)}));
 const scheduledCount=project.tasks.filter(t=>g.span(t)).length;
 const cpm=useMemo(()=>g.criticalPath(project.tasks),[project.tasks]);
 const criticalIds=new Set(showCritical&&legacyCritical&&mode!=='hierarchy'?cpm.criticalIds:[]);
 const criticalEdges=new Set(showCritical&&legacyCritical&&mode!=='hierarchy'?cpm.criticalEdges:[]);
 const connect=(source,target)=>{
  if(!source||!target||source===target)return;
  const successor=project.tasks.find(t=>t.id===target);
  if(!successor)return;
  if(successor.dependsOn.includes(source)){setSelectedLink({fromId:source,toId:target});setLinkSource(null);setLinkPreview(null);return;}
  try{model.setTaskDependencies(project,target,[...successor.dependsOn,source]);setLinkError('');setLinkSource(null);setLinkPreview(null);onLink(target,source)}catch(e){setLinkError(e.message);setLinkPreview(null)}
 };
 const targetTap=(taskId,isTap)=>{if(!isTap||!linkSource||linkSource===taskId)return false;connect(linkSource,taskId);return true};
 const sessionPoint=(source,dx,dy)=>{
  const sess=linkSession.current;
  const delta=sess?viewportMath.dragDelta(dx,dy,offsets.current.x,offsets.current.y,sess.scrollX,sess.scrollY,sess.contactX,sess.contactY):{x:dx,y:dy};
  return g.linkGesturePoint(rows,day0,dayWidth,source,delta.x,delta.y);
 };
 const updatePreview=()=>{const ses=linkSession.current;if(!ses)return;const point=sessionPoint(ses.source,ses.dx,ses.dy);if(point)setLinkPreview({source:ses.source,...point})};
 const stopAutoPan=()=>{if(autoTimer.current){clearInterval(autoTimer.current);autoTimer.current=null}};
 const cancelLinkDrag=()=>{stopAutoPan();linkSession.current=null;setIsLinkDragging(false);setLinkSource(null);setLinkPreview(null)};
 const startLink=(source,touchX,touchY)=>{
  stopAutoPan();setIsLinkDragging(true);setLinkError('');setLinkSource(source);setLinkPreview(null);
  const origin=g.connectorPoint(rows,day0,dayWidth,source);
  linkSession.current={source,dx:0,dy:0,touchX,touchY,scrollX:offsets.current.x,scrollY:offsets.current.y,contactX:0,contactY:0};
  // A first gesture may arrive before the viewport has been measured. Do not apply an untrusted offset.
  const updateContact=rect=>{
   const session=linkSession.current;
   if(!rect||!origin||!session||session.source!==source||!Number.isFinite(touchX)||!Number.isFinite(touchY))return;
   const x=touchX-rect.x-labelsWidth+session.scrollX-origin.x;
   const y=touchY-rect.y+session.scrollY-origin.y;
   if(Math.abs(x)<32&&Math.abs(y)<32){session.contactX=x;session.contactY=y;updatePreview();}
  };
  updateContact(viewportRect.current);
  viewport.current?.measureInWindow?.((x,y,width,height)=>{const rect={x,y,width,height};viewportRect.current=rect;viewportSize.current={width,height};updateContact(rect)});
  autoTimer.current=setInterval(()=>{
   const ses=linkSession.current,rect=viewportRect.current;if(!ses||!rect)return;
   const vx=viewportMath.edgeVelocity(ses.touchX,rect.x+labelsWidth,Math.max(0,rect.width-labelsWidth),48);
   const vy=viewportMath.edgeVelocity(ses.touchY,rect.y,rect.height,48);
   if(vx)scrollXTo(offsets.current.x+vx);
   if(vy)scrollYTo(offsets.current.y+vy);
   if(vx||vy)updatePreview();
  },40);
 };
 const pointer=(source,dx,dy,screenX,screenY)=>{
  if(!linkSession.current||linkSession.current.source!==source)return;
  Object.assign(linkSession.current,{dx,dy,touchX:screenX,touchY:screenY});updatePreview();
 };
 const finishLink=(source,dx,dy,isTap)=>{
  if(!linkSession.current||linkSession.current.source!==source)return;
  setIsLinkDragging(false);
  const point=sessionPoint(source,dx||0,dy||0);
  stopAutoPan();linkSession.current=null;
  if(isTap){setLinkPreview(null);return;}
  if(!point){setLinkError('Cannot locate the connector. Tap a destination task to link.');setLinkPreview(null);return;}
  const target=g.linkTargetAt(rows,day0,dayWidth,point.x,point.y,source);
  if(target)connect(source,target);
  else setLinkError('No task at the release point. Tap a destination bar to link.');
  setLinkPreview(null);
 };
 const removeSelectedLink=()=>{
  if(!selectedLink)return;
  const {toId,fromId}=selectedLink;
  const task=project.tasks.find(t=>t.id===toId);
  if(!task?.dependsOn?.includes(fromId)){setSelectedLink(null);return;}
  try{
   model.setTaskDependencies(project,toId,task.dependsOn.filter(id=>id!==fromId));
   onLink(toId,fromId);
   setLinkError('');setSelectedLink(null);setLinkSource(null);setLinkPreview(null);
  }catch(e){setLinkError(e.message)}
 };
 const choosePredecessor=(taskId,predecessorId)=>{try{const t=project.tasks.find(x=>x.id===taskId);const deps=t.dependsOn.includes(predecessorId)?t.dependsOn.filter(x=>x!==predecessorId):[...t.dependsOn,predecessorId];model.setTaskDependencies(project,taskId,deps);setLinkError('');onLink(taskId,predecessorId)}catch(e){setLinkError(e.message)}};
 const align=taskId=>{try{g.afterPredecessors(project,taskId);setLinkError('');onAlign(taskId)}catch(e){setLinkError(e.message)}};
 const monthSegments=[];
 for(let i=0;i<days.length;){let j=i+1;while(j<days.length&&days[j].slice(0,7)===days[i].slice(0,7))j++;
  monthSegments.push({date:days[i],i,width:(j-i)*dayWidth});i=j;}
 const viewDays=Math.max(1,Math.floor(Math.max(100,width-labelsWidth)/dayWidth));
 const centerOn=(date)=>{const day=g.dayNumber(date);if(day===null)return;const local=day-day0; if(local<0||local>=base.count){setCalendarOffset(day-base.from-7);setTimeout(()=>scroll.current?.scrollTo({x:0,animated:false}),0);return;}
  scroll.current?.scrollTo({x:Math.max(0,(local-3)*dayWidth),animated:true});};
 // A project switch must not retain horizontal scroll state from the prior project.
 useEffect(()=>{setCalendarOffset(0);setLinkTask(null);setLinkError('');setLinkSource(null);setLinkPreview(null);setSelectedLink(null);setShowLinks(false);scroll.current?.scrollTo({x:0,animated:false})},[project.id]);
 return <View style={{minWidth:0}} onLayout={e=>setWidth(Math.max(280,e.nativeEvent.layout.width))}>
  <View style={{backgroundColor:K.panel,borderColor:K.border,borderWidth:1,borderRadius:12,padding:12,marginBottom:12,gap:12}}>
   <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8}}>
    <View style={{flexDirection:'row',alignItems:'center',gap:4}}>
     <Control label="−" onPress={()=>changeZoom(viewportMath.zoomWidth(dayWidth,.75))}/>
     <Control label="+" onPress={()=>changeZoom(viewportMath.zoomWidth(dayWidth,1.33))}/>
     <Control label="Fit" onPress={()=>{zoomAnchor.current=0;setDayWidth(viewportMath.fitWidth(Math.max(80,width-labelsWidth-14),base.count))}}/>
    </View>
    <T size={11} color={K.muted}>{Math.round(dayWidth)} px/day</T>
    <Control label="Today" icon="locate-outline" onPress={()=>centerOn(now)}/>
   </View>
   <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
    <T size={11} color={K.muted}>View</T><View style={{flex:1,flexDirection:'row',gap:4}}>{Object.keys(zoomLevels).map(k=><View key={k} style={{flex:1}}><Control label={k} selected={zoom===k} onPress={()=>changeZoom(zoomLevels[k])}/></View>)}</View>
   </View>
   <View style={{flexDirection:'row',alignItems:'center',gap:8,justifyContent:'space-between',flexWrap:'wrap'}}>
    <View style={{flexDirection:'row',alignItems:'center',gap:4,flexWrap:'wrap'}}><Control label="Status" selected={mode==='status'} onPress={()=>setMode('status')}/><Control label="Stage" selected={mode==='stage'} onPress={()=>setMode('stage')}/><Control label="Tree" selected={mode==='hierarchy'} onPress={()=>setMode('hierarchy')}/></View>
    <Control label={`Links ${linkPaths.length}`} icon="git-network-outline" disabled={!linkPaths.length} onPress={()=>setShowLinks(true)}/>
    <Control label="More" icon="options-outline" onPress={()=>setShowHelp(v=>!v)}/>
   </View>
   {showHelp&&<View style={{padding:12,borderRadius:8,backgroundColor:K.panel2,gap:8}}>
     <T size={11} color={K.muted}>Pinch the chart to zoom. Drag the connector toward an edge to pan in any direction. Hold the bar to move; drag the right grip to resize.</T>
     <View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}><Control label="Critical path" icon="git-branch-outline" disabled={!legacyCritical} selected={showCritical&&legacyCritical} onPress={()=>setShowCritical(v=>!v)}/><Control label="Earlier" icon="chevron-back" onPress={()=>{setCalendarOffset(v=>v-45);scrollXTo(0)}}/><Control label="Later" icon="chevron-forward" onPress={()=>{setCalendarOffset(v=>v+45);scrollXTo(0)}}/></View>
     <T size={11} color={K.muted}>{project.tasks.length} tasks · {viewDays} days visible</T>
    </View>}
   <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8}}>
     <T size={11} color={K.muted} lines={1}>{showCritical&&legacyCritical?`Critical: ${cpm.totalDays} days · ${cpm.criticalIds.length} tasks`:`${project.tasks.length} tasks · pinch to zoom`}</T>
     {(conflicts.length>0||invalidIds.size>0)&&<Pressable onPress={()=>setShowScheduleIssues(v=>!v)} style={{flexDirection:'row',gap:5,alignItems:'center',padding:6}}><Icon name="alert-circle-outline" size={15} color={K.amber}/><T size={11} color={K.amber}>{conflicts.length+invalidIds.size} issues</T></Pressable>}
   </View>
   {showHelp&&<T color={K.muted} size={11}>{legacyCritical?'Critical path estimates calendar-day FS/0 only, no resource leveling':'Critical path unavailable for working calendars or non-FS/0 relations; review schedule in Scheduling'}</T>}
   {!!linkSource&&<View style={{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:8}}><T color={K.cyan} size={11}>Linking {project.tasks.find(t=>t.id===linkSource)?.title}. Release over a task or tap its bar.</T><Control label="Cancel" onPress={()=>{cancelLinkDrag();setLinkError('')}} icon="close-outline"/></View>}
   {!!linkError&&<T color={K.red} size={12}>{linkError}</T>}
   {showScheduleIssues&&<View style={{gap:6}}>{invalidIds.size>0&&<T color={K.red} size={11}>{invalidIds.size} task(s) have invalid dates. Edit their start and due dates.</T>}{conflicts.length>0&&<T color={K.amber} size={11}>{conflicts.length} successor(s) start before predecessors end. Review the scheduling controls for dependency types, lag, and calendar constraints.</T>}</View>}
   {project.id==='sample-workspace'&&project.tasks.length>0&&scheduledCount===0&&<View style={{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:8}}><T size={11} color={K.amber}>Sample tasks have no dates. Recovery snapshot is saved before adding demo dates.</T><Control label="Populate example Gantt" icon="calendar-outline" onPress={onSampleSchedule}/></View>}
   {base.clipped&&<T color={K.amber} size={11}>Long schedule: showing a bounded date window.</T>}
  </View>
  <View ref={viewport} collapsable={false} onLayout={e=>{viewportSize.current={...viewportSize.current,width:e.nativeEvent.layout.width,height:e.nativeEvent.layout.height};measureViewport()}} onTouchStart={pinchStart} onTouchMove={pinchMove} onTouchEnd={pinchEnd} onTouchCancel={pinchEnd} style={{borderWidth:1,borderColor:K.border,borderRadius:12,overflow:'hidden',backgroundColor:K.panel,height:Math.min(viewportHeight,Math.max(260,totalHeight))}}>
   <ScrollView ref={vertical} nestedScrollEnabled scrollEventThrottle={16} onScroll={e=>{offsets.current.y=e.nativeEvent.contentOffset.y}} scrollEnabled={!isLinkDragging&&!pinchActive} contentContainerStyle={{height:totalHeight}}>
    <View style={{flexDirection:'row',height:totalHeight}}>
   <View style={{width:labelsWidth,backgroundColor:K.panel,borderRightColor:K.border,borderRightWidth:1,zIndex:1}}>
    <View style={{height:HEADER,justifyContent:'center',paddingHorizontal:12,borderBottomWidth:1,borderBottomColor:K.border,backgroundColor:K.panel2}}><T bold size={11}>Tasks</T><T size={10} color={K.muted}>Title · links</T></View>
    {rows.map(row=>row.kind==='group'?<View key={row.key} style={{height:row.height,backgroundColor:'#24252d',justifyContent:'center',paddingHorizontal:10,borderBottomWidth:1,borderBottomColor:K.border}}><T color={K.ink} size={11} bold>{row.title}</T></View>:<View key={row.key} style={{height:row.height,backgroundColor:row.top%2?K.panel:K.side,borderBottomWidth:1,borderBottomColor:K.border,paddingHorizontal:8,justifyContent:'center'}}>
     <View style={{flexDirection:'row',alignItems:'center',paddingLeft:Math.min(row.depth||0,5)*12,gap:6}}>
      {mode==='hierarchy'&&row.hasChildren&&<Pressable accessibilityRole="button" accessibilityLabel={`${row.collapsed?'Expand':'Collapse'} subtasks of ${row.task.title}`} onPress={()=>setCollapsed(current=>row.collapsed?current.filter(id=>id!==row.task.id):[...current,row.task.id])} style={{width:27,height:30,justifyContent:'center',alignItems:'center'}}><Icon name={row.collapsed?'chevron-forward-outline':'chevron-down-outline'} size={15}/></Pressable>}
      {mode==='hierarchy'&&!row.hasChildren&&<View style={{width:27}}/>}
      <Pressable style={{flex:1}} accessibilityLabel={`Open task ${row.task.title}`} onPress={()=>onOpen(row.task.id)}><T bold lines={1} size={12}>{row.task.title}</T></Pressable>
     </View>
     <View style={{flexDirection:'row',alignItems:'center',gap:9,marginTop:5}}><View style={{width:6,height:6,backgroundColor:statusColor[row.task.status],borderRadius:4}}/><Pressable accessibilityRole="button" accessibilityLabel={`Edit predecessors for ${row.task.title}`} onPress={()=>{setLinkError('');setLinkTask(row.task.id)}}><Icon name="git-network-outline" size={18} color={K.cyan}/></Pressable>{(row.task.dependsOn||[]).length>0&&<Pressable accessibilityRole="button" accessibilityLabel={`Review ${row.task.dependsOn.length} predecessors of ${row.task.title}`} onPress={()=>{setLinkTask(row.task.id);setLinkError('')}} style={{paddingHorizontal:4,paddingVertical:3,borderRadius:5,backgroundColor:K.panel2}}><T color={K.muted} size={10}>{row.task.dependsOn.length}</T></Pressable>}
      {mode==='hierarchy'&&row.hasChildren&&<T size={10} color={K.muted}>{rollups.get(row.task.id)?.progress??0}% · {row.childCount} children</T>}{row.task.milestone&&<Icon name="diamond-outline" size={14} color={K.amber}/>}
      {(conflictIds.has(row.task.id)||invalidIds.has(row.task.id))&&<Icon name="warning-outline" size={16} color={K.red}/>}
      {g.span(row.task)?<T size={9} color={K.muted}>{row.task.due||row.task.start}</T>:invalidIds.has(row.task.id)?<T size={9} color={K.red}>Invalid dates</T>:<Pressable onPress={()=>onSchedule(row.task.id)}><T size={10} color={K.purple} bold>+ Schedule</T></Pressable>}
     </View>
    </View>)}
   </View>
   <ScrollView ref={scroll} horizontal showsHorizontalScrollIndicator nestedScrollEnabled scrollEnabled={!isLinkDragging&&!pinchActive} onScroll={e=>{offsets.current.x=e.nativeEvent.contentOffset.x}} style={{flex:1}} contentContainerStyle={{width:canvasWidth,height:totalHeight}} scrollEventThrottle={16}>
    <View collapsable={false} style={{width:canvasWidth,height:totalHeight,position:'relative'}}>
     <View style={{height:28,flexDirection:'row',backgroundColor:K.panel2,borderBottomWidth:1,borderBottomColor:K.border}}>{monthSegments.map((s,i)=><View key={i} style={{width:s.width,height:28,justifyContent:'center',borderRightWidth:1,borderRightColor:K.border,paddingLeft:7}}><T size={11} color={K.ink} bold>{monthLabel.format(new Date(s.date+'T00:00:00Z'))}</T></View>)}</View>
     <View style={{height:32,flexDirection:'row',backgroundColor:K.panel2,borderBottomWidth:1,borderBottomColor:K.border}}>{days.map((day,i)=>{const weekdayNum=new Date(day+'T00:00:00Z').getUTCDay();const displayed=(zoom==='Days')||(zoom==='Weeks'&&(weekdayNum===1||i===0))||(zoom==='Months'&&(day.endsWith('-01')||i===0));return <View key={day} style={{width:dayWidth,height:32,alignItems:'center',justifyContent:'center',borderRightWidth:(weekdayNum===0||zoom==='Days')?1:0,borderRightColor:K.border}}>{displayed&&<T size={zoom==='Months'?8:9} color={day===now?K.purple:K.muted} bold>{zoom==='Days'?day.slice(8):dayLabel.format(new Date(day+'T00:00:00Z'))}</T>}{zoom==='Days'&&<T size={8} color={K.muted}>{weekday.format(new Date(day+'T00:00:00Z'))}</T>}</View>})}</View>
     {rows.map(row=><View key={row.key} pointerEvents="none" style={{position:'absolute',left:0,right:0,top:row.top,height:row.height,borderBottomWidth:1,borderBottomColor:K.border,backgroundColor:row.kind==='group'?'#24252d':row.top%2?K.panel:K.side}}/>)}
     <View pointerEvents="none" style={{position:'absolute',top:HEADER,bottom:0,left:0,right:0,flexDirection:'row'}}>{days.map((day,i)=>{const dow=new Date(day+'T00:00:00Z').getUTCDay();return <View key={day} style={{width:dayWidth,height:'100%',backgroundColor:dow===0||dow===6?'#ffffff08':'transparent',borderLeftWidth:dow===1||zoom==='Days'?1:0,borderLeftColor:K.border}}/>})}</View>
     {g.dayNumber(now)>=day0&&g.dayNumber(now)<day0+base.count&&<View pointerEvents="none" style={{position:'absolute',left:(g.dayNumber(now)-day0)*dayWidth+dayWidth/2,top:HEADER,bottom:0,width:2,backgroundColor:K.purple,opacity:.65}}/>}
     <Svg pointerEvents="box-none" width={canvasWidth} height={totalHeight} style={{position:'absolute',left:0,top:0,zIndex:2}}>
      {linkPaths.map(path=><Dependency key={path.key} path={path} critical={criticalEdges.has(path.key)} selected={selectedLink?.fromId===path.fromId&&selectedLink?.toId===path.toId} onSelect={()=>{setSelectedLink({fromId:path.fromId,toId:path.toId});setLinkSource(null);setLinkPreview(null)}}/>)}
     </Svg>
     {linkPreview&&(()=>{
      const row=rows.find(r=>r.kind==='task'&&r.task.id===linkPreview.source);
      const geo=row&&g.barGeometry(row.task,day0,dayWidth);
      if(!geo)return null;
      const startX=geo.milestone?geo.x+dayWidth/2:geo.endX;
      const previewPath={x1:startX,y1:row.center,x2:linkPreview.x+8,y2:linkPreview.y,elbow:Math.max(startX+18,linkPreview.x+16)};
      return <Svg pointerEvents="none" width={canvasWidth} height={totalHeight} style={{position:'absolute',left:0,top:0,zIndex:7}}>
       <Path d={g.dependencyCurve(previewPath)} fill="none" stroke={K.amber} strokeWidth={2.5} strokeLinecap="round" strokeDasharray="5 5"/>
       <Circle cx={linkPreview.x} cy={linkPreview.y} r={5} fill={K.amber}/>
      </Svg>;
     })()}
     {rows.filter(row=>row.kind==='task').map(row=>{
       const summary=mode==='hierarchy'&&row.hasChildren?summaries.get(row.task.id):null;
       if(summary){
        const left=(summary.start-day0)*dayWidth,width=Math.max(3,(summary.end-summary.start+1)*dayWidth);
        return <Pressable key={row.key} accessibilityLabel={`Open summary for ${row.task.title}, ${summary.progress}% complete`} onPress={()=>onOpen(row.task.id)} style={{position:'absolute',left,top:row.top+18,height:25,width,borderColor:K.accentBorder,borderWidth:1,backgroundColor:K.panel2,borderRadius:5,zIndex:4,overflow:'hidden'}}><View style={{position:'absolute',left:0,top:0,bottom:0,width:`${summary.progress}%`,backgroundColor:K.purple,opacity:.75}}/>{width>75&&<T size={10} color={K.ink} bold style={{padding:4}} lines={1}>{row.task.title} · {summary.progress}%</T>}</Pressable>;
       }
       const geometry=g.barGeometry(row.task,day0,dayWidth);if(!geometry)return null;return <InteractiveBar key={row.key} task={row.task} row={row} geometry={geometry} color={conflictIds.has(row.task.id)?K.red:row.task.milestone?K.amber:statusColor[row.task.status]||K.purple} dayWidth={dayWidth} onOpen={onOpen} onMove={onMove} onResize={onResize} onLinkStart={startLink} onLinkPointer={pointer} onLinkFinish={finishLink} onTargetTap={targetTap} isCritical={criticalIds.has(row.task.id)} linkActive={linkSource===row.task.id}/>})}
    </View>
   </ScrollView>
    </View>
   </ScrollView>
  </View>
  {!project.tasks.length&&<T color={K.muted} style={{marginTop:12}}>No tasks yet. Add a task to start planning your roadmap.</T>}
  {showLinks&&<Modal visible transparent animationType="fade" onRequestClose={()=>setShowLinks(false)}><View style={{flex:1,backgroundColor:'#000b',alignItems:'center',justifyContent:'center',padding:16}}><View style={{width:'100%',maxWidth:470,maxHeight:'82%',backgroundColor:K.panel,borderWidth:1,borderColor:K.border,borderRadius:14,padding:18,gap:12}}>
   <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><T size={16} bold>Project dependencies</T><Control label="Close" icon="close-outline" onPress={()=>setShowLinks(false)}/></View>
   <T size={12} color={K.muted}>Select a relationship to inspect or remove it.</T>
   <ScrollView style={{maxHeight:410}}>{linkPaths.map(path=><Pressable key={path.key} accessibilityRole="button" onPress={()=>{setShowLinks(false);setSelectedLink({fromId:path.fromId,toId:path.toId})}} style={({pressed})=>({paddingVertical:14,paddingHorizontal:12,borderBottomWidth:1,borderBottomColor:K.border,backgroundColor:pressed?K.panel2:'transparent',flexDirection:'row',gap:10,alignItems:'center'})}>
    <Icon name="git-merge-outline" size={18} color={path.conflict?K.red:K.cyan}/><View style={{flex:1,gap:3}}><T size={12} bold lines={1}>{project.tasks.find(t=>t.id===path.fromId)?.title||path.fromId}</T><T size={11} color={K.muted} lines={1}>precedes {project.tasks.find(t=>t.id===path.toId)?.title||path.toId}</T></View><Icon name="chevron-forward-outline" size={18}/>
   </Pressable>)}</ScrollView>
  </View></View></Modal>}
  {selectedLink&&<Modal visible transparent animationType="fade" onRequestClose={()=>setSelectedLink(null)}><View style={{flex:1,backgroundColor:'#000b',alignItems:'center',justifyContent:'center',padding:16}}><View style={{width:'100%',maxWidth:430,backgroundColor:K.panel,borderColor:K.border,borderWidth:1,borderRadius:14,padding:20,gap:12}}>
   <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><T size={16} bold>Dependency</T><Control label="Close" icon="close-outline" onPress={()=>setSelectedLink(null)}/></View>
   <View style={{borderTopWidth:1,borderColor:K.border,paddingTop:12,gap:8}}><T color={K.muted} size={11}>Predecessor</T><T size={14} bold>{project.tasks.find(t=>t.id===selectedLink.fromId)?.title||selectedLink.fromId}</T><Icon name="arrow-down" size={19} color={K.cyan}/><T color={K.muted} size={11}>Successor</T><T size={14} bold>{project.tasks.find(t=>t.id===selectedLink.toId)?.title||selectedLink.toId}</T></View>
   <T color={K.muted} size={11}>Removing this dependency does not delete either task or change its scheduled dates.</T>
   <View style={{flexDirection:'row',justifyContent:'flex-end',gap:8}}><Control label="Cancel" onPress={()=>setSelectedLink(null)}/><Pressable accessibilityRole="button" accessibilityLabel="Remove dependency" onPress={removeSelectedLink} style={{backgroundColor:'#38252d',borderWidth:1,borderColor:'#6b3d4c',borderRadius:8,minHeight:40,paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:8}}><Icon name="unlink-outline" color={K.red}/><T color={K.red} size={12} bold>Remove link</T></Pressable></View>
  </View></View></Modal>}
  {linkTask&&<Modal visible transparent animationType="fade" onRequestClose={()=>setLinkTask(null)}><View style={{flex:1,backgroundColor:'#000b',alignItems:'center',justifyContent:'center',padding:16}}><View style={{width:'100%',maxWidth:470,maxHeight:'88%',padding:18,backgroundColor:K.panel,borderWidth:1,borderColor:K.border,borderRadius:12}}>
   <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12}}><T size={16} bold>Task dependencies</T><Control label="Close" icon="close-outline" onPress={()=>setLinkTask(null)}/></View>
   <T size={12} color={K.muted} style={{marginBottom:12}}>Choose predecessors for {project.tasks.find(x=>x.id===linkTask)?.title}. Dependencies must be completed first; cycles are rejected.</T>
   <ScrollView style={{maxHeight:320}}>{project.tasks.filter(t=>t.id!==linkTask).map(t=>{const current=project.tasks.find(x=>x.id===linkTask);const checked=current?.dependsOn?.includes(t.id);return <Pressable key={t.id} onPress={()=>choosePredecessor(linkTask,t.id)} style={{paddingVertical:11,paddingHorizontal:4,flexDirection:'row',alignItems:'center',gap:10,borderBottomWidth:1,borderBottomColor:K.border}}><Icon name={checked?'checkbox':'square-outline'} color={checked?K.purple:K.muted} size={21}/><View style={{flex:1}}><T size={12} bold>{t.title}</T><T color={K.muted} size={10}>{t.id} · {t.due||'Unscheduled'}</T></View></Pressable>})}</ScrollView>
   {!!linkError&&<T size={11} color={K.red} style={{marginTop:10}}>{linkError}</T>}
   {conflicts.some(c=>c.taskId===linkTask)&&<View style={{gap:9,marginTop:14}}><T color={K.amber} size={11}>One or more dependency constraints conflict with task dates.</T>{legacyCritical&&<Control label="Align after predecessors" icon="calendar-outline" onPress={()=>align(linkTask)}/>}</View>}
   <View style={{marginTop:13,alignItems:'flex-end'}}><Control label="Done" onPress={()=>setLinkTask(null)} selected/></View>
  </View></View></Modal>}
 </View>;
}
