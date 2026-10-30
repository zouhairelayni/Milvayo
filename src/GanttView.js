import React, {useMemo,useRef,useState,useEffect} from 'react';
import {View,Text,ScrollView,Pressable,Modal,PanResponder,Platform} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import model from './model.cjs';
const g=model.gantt;
const K={bg:'#111217',panel:'#1c1d25',panel2:'#22232d',raised:'#292936',border:'#353641',ink:'#f1f0f6',muted:'#9998a6',purple:'#a68cff',green:'#8dd4ac',amber:'#efc47b',cyan:'#8dcbd9',red:'#ef8e9c',side:'#17181f'};
const HEADER=58;
const zoomLevels={Days:44,Weeks:28,Months:18};
const statusColor={Backlog:'#a2a2ae','In progress':K.purple,Validation:K.amber,Done:K.green};
const weekday=new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone:'UTC'});
const monthLabel=new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric',timeZone:'UTC'});
const dayLabel=new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'});
function T({children,size=12,color=K.ink,bold=false,style={},lines}){return <Text numberOfLines={lines} style={[{fontSize:size,color,fontWeight:bold?'700':'400'},style]}>{children}</Text>}
function Icon({name,size=16,color=K.muted}){return <Ionicons name={name} size={size} color={color}/>}
function Control({label,onPress,selected=false,icon,disabled=false}){return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({pressed})=>({paddingHorizontal:10,minHeight:35,paddingVertical:7,borderWidth:1,borderRadius:8,borderColor:selected?K.purple:K.border,backgroundColor:selected?'#38304d':K.panel2,opacity:disabled?.4:pressed?.7:1,flexDirection:'row',alignItems:'center',gap:6})}>{icon&&<Icon name={icon} color={selected?K.purple:K.muted}/>}<T size={11} color={selected?K.purple:K.ink} bold>{label}</T></Pressable>}
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
  onPanResponderGrant:()=>handlers.current.onLinkStart(task.id),
  onPanResponderMove:(_,p)=>handlers.current.onLinkPointer(task.id,p.moveX,p.moveY),
  onPanResponderRelease:(_,p)=>handlers.current.onLinkFinish(task.id,p.moveX,p.moveY,Math.abs(p.dx)+Math.abs(p.dy)<10),
  onPanResponderTerminate:()=>handlers.current.onLinkFinish(task.id,null,null,true)
 })).current;
 const barWidth=Math.max(22,geometry.width-5+preview.end);
 if(geometry.milestone)return <View style={{position:'absolute',left:geometry.x+dayWidth/2-12,top:row.top+11,height:36,width:52,zIndex:4,flexDirection:'row',alignItems:'center'}}><Pressable accessibilityLabel={`Open milestone ${task.title}`} onPress={()=>{if(!handlers.current.onTargetTap(task.id,true))onOpen(task.id)}} style={{width:20,height:20,transform:[{rotate:'45deg'}],backgroundColor:color,borderWidth:isCritical?3:2,borderColor:isCritical?K.amber:K.ink,borderRadius:2}}/><View {...connector.panHandlers} accessibilityLabel={`Connect milestone ${task.title} to a successor`} style={{marginLeft:6,width:24,height:32,justifyContent:'center',alignItems:'center'}}><Icon name="git-commit-outline" size={19} color={linkActive?K.amber:K.cyan}/></View></View>;
 return <View style={{position:'absolute',left:geometry.x+2+preview.dx,top:row.top+11,width:barWidth,height:36,backgroundColor:color,borderRadius:7,borderWidth:isCritical?2:1,borderColor:isCritical?K.amber:'#ffffff44',zIndex:3,flexDirection:'row',alignItems:'center',overflow:'hidden'}}>
  <View {...drag.panHandlers} accessibilityLabel={`Move ${task.title}; ${geometry.days} days`} style={{flex:1,height:36,justifyContent:'center',paddingLeft:9,paddingRight:3,...(Platform.OS==='web'?{cursor:'grab',userSelect:'none'}:{})}}><T size={11} color={K.bg} bold lines={1}>{barWidth>95?task.title:task.id}</T></View>
  {barWidth>70&&<Pressable onPress={()=>onOpen(task.id)} accessibilityLabel={`Edit ${task.title}`} style={{padding:4}}><Icon name="open-outline" size={13} color={K.bg}/></Pressable>}
  <View {...connector.panHandlers} accessible accessibilityLabel={`Connect ${task.title} to a successor`} style={{width:24,height:36,justifyContent:'center',alignItems:'center',backgroundColor:linkActive?'#152b32':'#14182111'}}><Icon name="git-commit-outline" size={17} color={linkActive?K.amber:K.bg}/></View>
  <View {...resizer.panHandlers} accessible accessibilityLabel={`Resize end of ${task.title}`} style={{height:36,width:16,backgroundColor:'#00000033',justifyContent:'center',alignItems:'center',...(Platform.OS==='web'?{cursor:'ew-resize'}:{})}}><View style={{width:3,height:14,borderRadius:2,backgroundColor:'#17181e88'}}/></View>
 </View>;
}
function Dependency({path,critical=false}){
 const {x1,x2,y1,y2,elbow,conflict}=path;const color=conflict?K.red:critical?K.amber:K.cyan;
 function segment(x,y,w,h,key){return <View key={key} style={{position:'absolute',left:x,top:y,width:Math.max(critical?3:2,w),height:Math.max(critical?3:2,h),backgroundColor:color,opacity:.88}}/>}
 return <React.Fragment>
  {segment(Math.min(x1,elbow),y1-1,Math.abs(elbow-x1),2,'first')}
  {segment(elbow-1,Math.min(y1,y2),2,Math.abs(y2-y1),'vertical')}
  {segment(Math.min(elbow,x2-8),y2-1,Math.abs(x2-8-elbow),2,'last')}
  <View style={{position:'absolute',left:x2-9,top:y2-8}}><Icon name="caret-forward" size={16} color={color}/></View>
 </React.Fragment>;
}
export default function GanttView({project,onOpen,onMove,onResize,onSchedule,onLink,onAlign,onSampleSchedule}){
 const [width,setWidth]=useState(380),[zoom,setZoom]=useState('Weeks'),[mode,setMode]=useState('status'),[linkTask,setLinkTask]=useState(null),[linkError,setLinkError]=useState(''),[calendarOffset,setCalendarOffset]=useState(0),[linkSource,setLinkSource]=useState(null),[linkPreview,setLinkPreview]=useState(null),[showCritical,setShowCritical]=useState(false);
 const dayWidth=zoomLevels[zoom];
 const now=new Date().toISOString().slice(0,10);
 const base=useMemo(()=>g.calendarDomain(project.tasks,now),[project.tasks,now]);
 const day0=base.from+calendarOffset;
 const days=Array.from({length:base.count},(_,i)=>g.dateAt(day0+i));
 const rows=useMemo(()=>g.layoutRows(g.buildRows(project.tasks,mode),HEADER),[project.tasks,mode]);
 const totalHeight=rows.length?rows[rows.length-1].top+rows[rows.length-1].height:HEADER+85;
 const canvasWidth=base.count*dayWidth;
 const labelsWidth=Math.max(124,Math.min(246,Math.round(width*.32)));
 const scroll=useRef(null);const canvasRef=useRef(null);const canvasOrigin=useRef(null);const conflicts=g.dependencyConflicts(project.tasks);
 const conflictIds=new Set(conflicts.map(x=>x.taskId));
 const invalidIds=new Set(g.invalidSchedules(project.tasks));
 const linkPaths=g.dependencyGeometry(rows,day0,dayWidth);
 const scheduledCount=project.tasks.filter(t=>g.span(t)).length;
 const cpm=useMemo(()=>g.criticalPath(project.tasks),[project.tasks]);
 const criticalIds=new Set(showCritical?cpm.criticalIds:[]);
 const criticalEdges=new Set(showCritical?cpm.criticalEdges:[]);
 const connect=(source,target)=>{
  if(!source||!target||source===target)return;
  const successor=project.tasks.find(t=>t.id===target);
  if(!successor)return;
  if(successor.dependsOn.includes(source)){setLinkError('These tasks are already linked. Use the predecessor editor to remove the link.');return;}
  try{model.setTaskDependencies(project,target,[...successor.dependsOn,source]);setLinkError('');setLinkSource(null);setLinkPreview(null);onLink(target,source)}catch(e){setLinkError(e.message);setLinkPreview(null)}
 };
 const targetTap=(taskId,isTap)=>{if(!isTap||!linkSource||linkSource===taskId)return false;connect(linkSource,taskId);return true};
 const pointer=(source,x,y)=>{
  if(!Number.isFinite(x)||!Number.isFinite(y))return;
  const origin=canvasOrigin.current;
  if(!origin)return;
  setLinkPreview({source,x:x-origin.x,y:y-origin.y});
 };
 const finishLink=(source,x,y,isTap)=>{
  if(isTap||x==null||y==null){setLinkPreview(null);return;}
  const origin=canvasOrigin.current;
  if(!origin){setLinkError('Unable to measure the timeline. Tap the successor bar to connect.');setLinkPreview(null);return;}
  const target=g.linkTargetAt(rows,day0,dayWidth,x-origin.x,y-origin.y,source);
  if(target)connect(source,target);
  else setLinkError('No task bar at the release point. Tap a successor bar, or drag the connector onto its bar.');
  setLinkPreview(null);
 };
 const startLink=source=>{canvasRef.current?.measureInWindow?.((x,y)=>{canvasOrigin.current={x,y}});setLinkError('');setLinkSource(source);setLinkPreview(null)};
 const choosePredecessor=(taskId,predecessorId)=>{try{const t=project.tasks.find(x=>x.id===taskId);const deps=t.dependsOn.includes(predecessorId)?t.dependsOn.filter(x=>x!==predecessorId):[...t.dependsOn,predecessorId];model.setTaskDependencies(project,taskId,deps);setLinkError('');onLink(taskId,predecessorId)}catch(e){setLinkError(e.message)}};
 const align=taskId=>{try{g.afterPredecessors(project,taskId);setLinkError('');onAlign(taskId)}catch(e){setLinkError(e.message)}};
 const monthSegments=[];
 for(let i=0;i<days.length;){let j=i+1;while(j<days.length&&days[j].slice(0,7)===days[i].slice(0,7))j++;
  monthSegments.push({date:days[i],i,width:(j-i)*dayWidth});i=j;}
 const viewDays=Math.max(1,Math.floor(Math.max(100,width-labelsWidth)/dayWidth));
 const centerOn=(date)=>{const day=g.dayNumber(date);if(day===null)return;const local=day-day0; if(local<0||local>=base.count){setCalendarOffset(day-base.from-7);setTimeout(()=>scroll.current?.scrollTo({x:0,animated:false}),0);return;}
  scroll.current?.scrollTo({x:Math.max(0,(local-3)*dayWidth),animated:true});};
 // A project switch must not retain horizontal scroll state from the prior project.
 useEffect(()=>{setCalendarOffset(0);setLinkTask(null);setLinkError('');setLinkSource(null);setLinkPreview(null);scroll.current?.scrollTo({x:0,animated:false})},[project.id]);
 return <View style={{minWidth:0}} onLayout={e=>setWidth(Math.max(280,e.nativeEvent.layout.width))}>
  <View style={{backgroundColor:K.panel,borderColor:K.border,borderWidth:1,borderRadius:12,padding:12,marginBottom:12,gap:10}}>
   <View style={{flexDirection:'row',alignItems:'center',gap:6,flexWrap:'wrap'}}><T color={K.muted} bold size={11}>Scale</T>{Object.keys(zoomLevels).map(k=><Control key={k} label={k} selected={zoom===k} onPress={()=>setZoom(k)}/>)}<Control label="Today" onPress={()=>centerOn(now)} icon="locate-outline"/><Control label="‹" onPress={()=>{setCalendarOffset(v=>v-90);scroll.current?.scrollTo({x:0,animated:false})}}/><Control label="›" onPress={()=>{setCalendarOffset(v=>v+90);scroll.current?.scrollTo({x:0,animated:false})}}/></View>
   <View style={{flexDirection:'row',alignItems:'center',gap:6,flexWrap:'wrap'}}><T color={K.muted} size={11}>Group</T><Control label="Status" selected={mode==='status'} onPress={()=>setMode('status')}/><Control label="Stage" selected={mode==='stage'} onPress={()=>setMode('stage')}/><Control label="Critical path" icon="git-branch-outline" selected={showCritical} onPress={()=>setShowCritical(v=>!v)}/><T size={10} color={K.muted}>{project.tasks.length} tasks · {viewDays} days visible</T></View>
   <T color={K.muted} size={11}>Move bars to reschedule · right edge to resize · connector dot to link tasks.</T>
   {showCritical&&<T color={K.amber} size={11}>Critical path: {cpm.totalDays} calendar days · {cpm.criticalIds.length} tasks. Finish-to-start, no weekends or resource limits modeled. {cpm.excludedIds.length?`${cpm.excludedIds.length} unscheduled excluded.`:''}</T>}
   {!!linkSource&&<View style={{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:8}}><T color={K.cyan} size={11} bold>Linking {project.tasks.find(t=>t.id===linkSource)?.title}: drag connector to a successor or tap its bar.</T><Control label="Cancel" onPress={()=>{setLinkSource(null);setLinkPreview(null);setLinkError('')}} icon="close-outline"/></View>}
   {!!linkError&&<T color={K.red} size={11}>{linkError}</T>}
   {invalidIds.size>0&&<T color={K.red} size={11}>{invalidIds.size} task(s) have invalid or reversed dates. Edit their start/due values to show their bars.</T>}
   {conflicts.length>0&&<T color={K.amber} size={11}>{conflicts.length} dependency scheduling conflict(s): a successor begins before its predecessor finishes. Select its link icon to align dates.</T>}
   {project.id==='sample-workspace'&&project.tasks.length>0&&scheduledCount===0&&<View style={{flexDirection:'row',alignItems:'center',flexWrap:'wrap',gap:9}}><T size={11} color={K.amber}>This sample workspace has no dates. Populating dates reopens verification; a recovery snapshot is saved.</T><Control label="Populate example Gantt" icon="calendar-outline" onPress={onSampleSchedule}/></View>}
   {base.clipped&&<T color={K.amber} size={11}>Long timeline: showing a bounded date window; use Today to jump to the current period.</T>}
  </View>
  <View style={{flexDirection:'row',borderWidth:1,borderColor:K.border,borderRadius:12,overflow:'hidden',backgroundColor:K.panel,minHeight:Math.min(totalHeight,420)}}>
   <View style={{width:labelsWidth,backgroundColor:K.panel,borderRightColor:K.border,borderRightWidth:1,zIndex:1}}>
    <View style={{height:HEADER,justifyContent:'center',paddingHorizontal:12,borderBottomWidth:1,borderBottomColor:K.border,backgroundColor:K.panel2}}><T bold size={11}>TASKS</T><T size={9} color={K.muted}>Name · dependencies</T></View>
    {rows.map(row=>row.kind==='group'?<View key={row.key} style={{height:row.height,backgroundColor:'#302b3c',justifyContent:'center',paddingHorizontal:10,borderBottomWidth:1,borderBottomColor:K.border}}><T color={K.purple} size={11} bold>{row.title}</T></View>:<View key={row.key} style={{height:row.height,backgroundColor:row.top%2?K.panel:K.side,borderBottomWidth:1,borderBottomColor:K.border,paddingHorizontal:8,justifyContent:'center'}}>
     <Pressable accessibilityLabel={`Open task ${row.task.title}`} onPress={()=>onOpen(row.task.id)}><T bold lines={1} size={11}>{row.task.title}</T></Pressable>
     <View style={{flexDirection:'row',alignItems:'center',gap:9,marginTop:5}}><View style={{width:6,height:6,backgroundColor:statusColor[row.task.status],borderRadius:4}}/><Pressable accessibilityRole="button" accessibilityLabel={`Edit predecessors for ${row.task.title}`} onPress={()=>{setLinkError('');setLinkTask(row.task.id)}}><Icon name="git-network-outline" size={18} color={K.cyan}/></Pressable>
      {row.task.milestone&&<Icon name="diamond-outline" size={14} color={K.amber}/>}
      {(conflictIds.has(row.task.id)||invalidIds.has(row.task.id))&&<Icon name="warning-outline" size={16} color={K.red}/>}
      {g.span(row.task)?<T size={9} color={K.muted}>{row.task.due||row.task.start}</T>:invalidIds.has(row.task.id)?<T size={9} color={K.red}>Invalid dates</T>:<Pressable onPress={()=>onSchedule(row.task.id)}><T size={10} color={K.purple} bold>+ Schedule</T></Pressable>}
     </View>
    </View>)}
   </View>
   <ScrollView ref={scroll} horizontal showsHorizontalScrollIndicator nestedScrollEnabled style={{flex:1}} contentContainerStyle={{width:canvasWidth,height:totalHeight}} scrollEventThrottle={16}>
    <View ref={canvasRef} collapsable={false} style={{width:canvasWidth,height:totalHeight,position:'relative'}}>
     <View style={{height:27,flexDirection:'row',backgroundColor:K.panel2,borderBottomWidth:1,borderBottomColor:K.border}}>{monthSegments.map((s,i)=><View key={i} style={{width:s.width,height:27,justifyContent:'center',borderRightWidth:1,borderRightColor:K.border,paddingLeft:7}}><T size={11} color={K.ink} bold>{monthLabel.format(new Date(s.date+'T00:00:00Z'))}</T></View>)}</View>
     <View style={{height:31,flexDirection:'row',backgroundColor:K.panel2,borderBottomWidth:1,borderBottomColor:K.border}}>{days.map((day,i)=>{const weekdayNum=new Date(day+'T00:00:00Z').getUTCDay();const displayed=zoom==='Days'||(zoom==='Weeks'&&(weekdayNum===1||i===0))||(zoom==='Months'&&(day.endsWith('-01')||i===0));return <View key={day} style={{width:dayWidth,height:31,alignItems:'center',justifyContent:'center',borderRightWidth:(weekdayNum===0||zoom==='Days')?1:0,borderRightColor:K.border}}>{displayed&&<T size={zoom==='Months'?8:9} color={day===now?K.purple:K.muted} bold>{zoom==='Days'?day.slice(8):dayLabel.format(new Date(day+'T00:00:00Z'))}</T>}{zoom==='Days'&&<T size={8} color={K.muted}>{weekday.format(new Date(day+'T00:00:00Z'))}</T>}</View>})}</View>
     {rows.map(row=><View key={row.key} pointerEvents="none" style={{position:'absolute',left:0,right:0,top:row.top,height:row.height,borderBottomWidth:1,borderBottomColor:K.border,backgroundColor:row.kind==='group'?'#302b3c':row.top%2?K.panel:K.side}}/>)}
     <View pointerEvents="none" style={{position:'absolute',top:HEADER,bottom:0,left:0,right:0,flexDirection:'row'}}>{days.map((day,i)=>{const dow=new Date(day+'T00:00:00Z').getUTCDay();return <View key={day} style={{width:dayWidth,height:'100%',backgroundColor:dow===0||dow===6?'#ffffff08':'transparent',borderLeftWidth:dow===1||zoom==='Days'?1:0,borderLeftColor:K.border}}/>})}</View>
     {g.dayNumber(now)>=day0&&g.dayNumber(now)<day0+base.count&&<View pointerEvents="none" style={{position:'absolute',left:(g.dayNumber(now)-day0)*dayWidth+dayWidth/2,top:HEADER,bottom:0,width:2,backgroundColor:K.purple,opacity:.65}}/>}
     <View pointerEvents="none" style={{position:'absolute',left:0,top:0,right:0,bottom:0}}>{linkPaths.map(p=><Dependency path={p} critical={criticalEdges.has(p.key)} key={p.key}/>)}</View>
     {linkPreview&&(()=>{const sourceRow=rows.find(r=>r.kind==='task'&&r.task.id===linkPreview.source);const sourceBar=sourceRow&&g.barGeometry(sourceRow.task,day0,dayWidth);if(!sourceBar)return null;const x1=sourceBar.milestone?sourceBar.x+dayWidth/2:sourceBar.endX;const y1=sourceRow.center;const x2=linkPreview.x,y2=linkPreview.y;return <View pointerEvents="none" style={{position:'absolute',left:0,top:0,right:0,bottom:0,zIndex:7}}><View style={{position:'absolute',left:Math.min(x1,x2),top:y1,width:Math.abs(x2-x1),height:2,backgroundColor:K.amber}}/><View style={{position:'absolute',left:x2,top:Math.min(y1,y2),width:2,height:Math.abs(y2-y1),backgroundColor:K.amber}}/><View style={{position:'absolute',left:x2-5,top:y2-5,width:10,height:10,borderRadius:5,backgroundColor:K.amber}}/></View>})()}
     {rows.filter(row=>row.kind==='task').map(row=>{const geometry=g.barGeometry(row.task,day0,dayWidth);if(!geometry)return null;return <InteractiveBar key={row.key} task={row.task} row={row} geometry={geometry} color={conflictIds.has(row.task.id)?K.red:row.task.milestone?K.amber:statusColor[row.task.status]||K.purple} dayWidth={dayWidth} onOpen={onOpen} onMove={onMove} onResize={onResize} onLinkStart={startLink} onLinkPointer={pointer} onLinkFinish={finishLink} onTargetTap={targetTap} isCritical={criticalIds.has(row.task.id)} linkActive={linkSource===row.task.id}/>})}
    </View>
   </ScrollView>
  </View>
  {!project.tasks.length&&<T color={K.muted} style={{marginTop:12}}>No tasks yet. Add a task to start planning your roadmap.</T>}
  {linkTask&&<Modal visible transparent animationType="fade" onRequestClose={()=>setLinkTask(null)}><View style={{flex:1,backgroundColor:'#000b',alignItems:'center',justifyContent:'center',padding:16}}><View style={{width:'100%',maxWidth:470,maxHeight:'88%',padding:18,backgroundColor:K.panel,borderWidth:1,borderColor:K.border,borderRadius:12}}>
   <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12}}><T size={16} bold>Task dependencies</T><Control label="Close" icon="close-outline" onPress={()=>setLinkTask(null)}/></View>
   <T size={12} color={K.muted} style={{marginBottom:12}}>Choose predecessors for {project.tasks.find(x=>x.id===linkTask)?.title}. Dependencies must be completed first; cycles are rejected.</T>
   <ScrollView style={{maxHeight:320}}>{project.tasks.filter(t=>t.id!==linkTask).map(t=>{const current=project.tasks.find(x=>x.id===linkTask);const checked=current?.dependsOn?.includes(t.id);return <Pressable key={t.id} onPress={()=>choosePredecessor(linkTask,t.id)} style={{paddingVertical:11,paddingHorizontal:4,flexDirection:'row',alignItems:'center',gap:10,borderBottomWidth:1,borderBottomColor:K.border}}><Icon name={checked?'checkbox':'square-outline'} color={checked?K.purple:K.muted} size={21}/><View style={{flex:1}}><T size={12} bold>{t.title}</T><T color={K.muted} size={10}>{t.id} · {t.due||'Unscheduled'}</T></View></Pressable>})}</ScrollView>
   {!!linkError&&<T size={11} color={K.red} style={{marginTop:10}}>{linkError}</T>}
   {conflicts.some(c=>c.taskId===linkTask)&&<View style={{gap:9,marginTop:14}}><T color={K.amber} size={11}>One or more predecessors end on or after this task's start date.</T><Control label="Align after predecessors" icon="calendar-outline" onPress={()=>align(linkTask)}/></View>}
   <View style={{marginTop:13,alignItems:'flex-end'}}><Control label="Done" onPress={()=>setLinkTask(null)} selected/></View>
  </View></View></Modal>}
 </View>;
}
