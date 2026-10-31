import React,{useState} from 'react';
import {View,Text,TextInput,Pressable,ScrollView} from 'react-native';
import Svg,{Path,Line,Circle} from 'react-native-svg';
import agile from './agile.cjs';
import design from './design.cjs';
const C=design.colors;
const pad={borderWidth:1,borderColor:C.border,backgroundColor:C.panel,borderRadius:12};
const today=()=>new Date().toISOString().slice(0,10);
const plusDays=(s,n)=>new Date(Date.parse(s+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
function Label({children,muted=false,size=12,style={}}){return <Text style={[{color:muted?C.muted:C.ink,fontSize:size,lineHeight:size*1.5},style]}>{children}</Text>}
function Action({children,onPress,active=false,disabled=false,danger=false}){return <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={typeof children==='string'?children:undefined} style={({pressed})=>({minHeight:44,justifyContent:'center',alignItems:'center',borderRadius:8,borderWidth:1,borderColor:active?C.accent:C.border,backgroundColor:active?C.accent:C.panel2,paddingHorizontal:14,opacity:disabled?.4:pressed?.7:1})}><Label size={12} style={{color:active?C.bg:danger?C.red:C.ink,fontWeight:active?'600':'400'}}>{children}</Label></Pressable>}
function Field({name,value,onChange,placeholder}){return <View style={{flex:1,minWidth:150,gap:5}}><Label muted>{name}</Label><TextInput accessibilityLabel={name} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={C.muted} style={{color:C.ink,fontSize:13,backgroundColor:C.panel2,minHeight:44,padding:12,borderWidth:1,borderColor:C.border,borderRadius:8}}/></View>}
function Burndown({values}){
 const [width,setWidth]=useState(320);const h=172,l=23,r=12,t=16,b=27;
 const yMax=Math.max(1,...values.map(x=>Math.max(x.ideal,x.remaining)));const px=i=>l+(i/Math.max(1,values.length-1))*(width-l-r);const py=n=>t+(1-n/yMax)*(h-t-b);
 const path=key=>values.map((p,i)=>`${i?'L':'M'}${px(i).toFixed(1)} ${py(p[key]).toFixed(1)}`).join(' ');
 if(!values.length)return <Label muted>Start the sprint to begin recording burndown history.</Label>;
 return <View onLayout={e=>setWidth(Math.max(190,e.nativeEvent.layout.width))} style={{paddingTop:10}}>
 <Svg width="100%" height={h} viewBox={`0 0 ${width} ${h}`}>
  {[0,.5,1].map(n=><Line key={n} x1={l} x2={width-r} y1={py(yMax*n)} y2={py(yMax*n)} stroke={C.border} strokeWidth="1"/>)}
  <Path d={path('ideal')} fill="none" stroke={C.muted} strokeDasharray="5 5" strokeWidth="1.4"/>
  <Path d={path('remaining')} fill="none" stroke={C.accent} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round"/>
  {values.length>0&&<Circle cx={px(values.length-1)} cy={py(values[values.length-1].remaining)} r={4} fill={C.accent}/>}
 </Svg>
 <View style={{flexDirection:'row',justifyContent:'space-between'}}><Label muted>{values[0].date}</Label><Label muted>{values[values.length-1].date}</Label></View>
 <View style={{flexDirection:'row',gap:16,marginTop:8}}><Label size={11}>━ Recorded remaining</Label><Label muted size={11}>┄ Ideal</Label></View>
 </View>;
}
export default function SprintPanel({project,onCreate,onAssign,onStart,onFinish,onDelete,onOpen,onError}){
 const [selected,setSelected]=useState('');const [expanded,setExpanded]=useState(false);const [name,setName]=useState('');const [goal,setGoal]=useState('');const [start,setStart]=useState(today());const [end,setEnd]=useState(plusDays(today(),13));const [search,setSearch]=useState('');const [confirmFinish,setConfirmFinish]=useState(false);const [limit,setLimit]=useState(40);
 const sprint=project.sprints.find(s=>s.id===selected)||project.sprints.find(s=>s.state==='active')||project.sprints.find(s=>s.state==='planned')||project.sprints.at(-1);
 const selectedId=sprint?.id||'';
 const assigned=sprint&&sprint.state!=='completed'?project.tasks.filter(t=>t.sprintId===selectedId):[];
 const backlog=project.tasks.filter(t=>!t.sprintId&&t.status!=='Done'&&[t.id,t.title,t.owner].join(' ').toLowerCase().includes(search.toLowerCase())).sort((a,b)=>a.position-b.position||a.id.localeCompare(b.id));
 const {total,done,remaining}=sprint?agile.summary(project,selectedId):{total:0,done:0,remaining:0};
 const values=sprint?agile.burndown(project,selectedId):[];
 const call=fn=>{try{fn()}catch(e){onError(e.message)}};
 return <View style={{gap:16}}>
  <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><View style={{flex:1,minWidth:165}}><Label size={20} style={{fontWeight:'600'}}>Sprints and backlog</Label><Label muted>Plan iterations and track work without changing task status</Label></View><Action onPress={()=>setExpanded(!expanded)} active={expanded}>{expanded?'Close form':'New sprint'}</Action></View>
  {expanded&&<View style={{...pad,padding:16,gap:12}}><Label size={15}>Create sprint</Label><Field name="Sprint name" value={name} onChange={setName} placeholder="Sprint 1"/><Field name="Sprint goal" value={goal} onChange={setGoal} placeholder="What will this iteration deliver?"/><View style={{flexDirection:'row',gap:9,flexWrap:'wrap'}}><Field name="Start · YYYY-MM-DD" value={start} onChange={setStart}/><Field name="End · YYYY-MM-DD" value={end} onChange={setEnd}/></View><View style={{flexDirection:'row',gap:8,justifyContent:'flex-end'}}><Action onPress={()=>setExpanded(false)}>Cancel</Action><Action active onPress={()=>call(()=>{const s=onCreate({name,goal,start,end});setSelected(s.id);setName('');setGoal('');setExpanded(false)})}>Save sprint</Action></View></View>}
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8,paddingBottom:3}}>{project.sprints.map(s=><Action key={s.id} active={s.id===selectedId} onPress={()=>{setSelected(s.id);setConfirmFinish(false)}}>{s.name} · {s.state}</Action>)}</ScrollView>
  {!sprint?<View style={{...pad,padding:25}}><Label size={15}>No sprints yet</Label><Label muted>Create a planned iteration, then assign tasks from your backlog.</Label></View>:<>
   <View style={{...pad,padding:17,gap:10}}><View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}><View style={{flex:1,minWidth:170}}><Label size={17} style={{fontWeight:'600'}}>{sprint.name}</Label><Label muted>{sprint.start} — {sprint.end} · {sprint.state}</Label></View><Label size={12} style={{color:C.accent}}>{done}/{total} complete</Label></View><Label>{sprint.goal||'No sprint goal set'}</Label><View style={{height:7,borderRadius:4,backgroundColor:C.raised,overflow:'hidden'}}><View style={{width:`${total?100*done/total:0}%`,height:7,backgroundColor:C.accent}}/></View><Label muted>{remaining} unfinished · {sprint.state==='completed'?'Final snapshot retained':'Progress updates as work changes'}</Label>
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{sprint.state==='planned'&&<><Action active onPress={()=>call(()=>onStart(sprint.id))}>Start sprint</Action><Action danger onPress={()=>call(()=>onDelete(sprint.id))}>Delete planned sprint</Action></>}{sprint.state==='active'&&<Action active={confirmFinish} onPress={()=>setConfirmFinish(!confirmFinish)}>{confirmFinish?'Cancel completion':'Finish sprint'}</Action>}</View>
   {confirmFinish&&sprint.state==='active'&&<View style={{...pad,padding:12,gap:9}}><Label>Finish this sprint? Completed and unfinished work will leave the active iteration. A final scope snapshot is retained, and unfinished tasks return to the backlog.</Label><Action active onPress={()=>call(()=>{onFinish(sprint.id);setConfirmFinish(false)})}>Confirm finish</Action></View>}
   </View>
   {(sprint.state==='active'||sprint.state==='completed')&&<View style={{...pad,padding:16}}><Label size={15} style={{fontWeight:'600'}}>Burndown</Label><Label muted>Recorded remaining tasks vs ideal progress · calendar days</Label><Burndown values={values}/></View>}
   {sprint.state!=='completed'&&<View style={{...pad,padding:14,gap:9}}><Label size={15} style={{fontWeight:'600'}}>Sprint tasks · {assigned.length}</Label>{assigned.length===0&&<Label muted>Assign tasks from the backlog below.</Label>}{assigned.slice(0,80).map(t=><View key={t.id} style={{flexDirection:'row',alignItems:'center',gap:8,paddingVertical:8,borderBottomWidth:1,borderBottomColor:C.border}}><Pressable accessibilityRole="button" onPress={()=>onOpen(t.id)} style={{flex:1,gap:3}}><Label size={12}>{t.title}</Label><Label muted size={10}>{t.id} · {t.status}</Label></Pressable><Action onPress={()=>call(()=>onAssign(t.id,''))}>Remove</Action></View>)}{assigned.length>80&&<Label muted>Showing first 80 tasks. Use the Tasks screen for the full list.</Label>}</View>}
  </>}
  <View style={{...pad,padding:14,gap:10}}><Label size={15} style={{fontWeight:'600'}}>Unscheduled backlog · {backlog.length}</Label><Field name="Find work" value={search} onChange={v=>{setSearch(v);setLimit(40)}} placeholder="Title, ID or assignee"/>{backlog.slice(0,limit).map(t=><View key={t.id} style={{flexDirection:'row',gap:8,alignItems:'center',paddingVertical:8,borderBottomWidth:1,borderBottomColor:C.border}}><Pressable onPress={()=>onOpen(t.id)} style={{flex:1,gap:2}} accessibilityRole="button"><Label size={12}>{t.title}</Label><Label muted size={10}>{t.id} · {t.priority} · {t.status}</Label></Pressable><Action disabled={!sprint||sprint.state==='completed'} onPress={()=>call(()=>onAssign(t.id,selectedId))}>Add</Action></View>)}{backlog.length>limit&&<Action onPress={()=>setLimit(Math.min(backlog.length,limit+40))}>Load more</Action>}{backlog.length===0&&<Label muted>No unassigned open tasks match this search.</Label>}</View>
 </View>;
}
