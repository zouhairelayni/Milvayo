import {SafeAreaProvider,SafeAreaView} from 'react-native-safe-area-context';
import React, {useMemo,useState} from 'react';
import {View,ScrollView,Pressable,Text,TextInput,Modal,useWindowDimensions} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import design from './design.cjs';
import scheduling from './scheduleProject.cjs';
const {colors:C}=design;
const WEEK=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const TYPES=[['FS','Finish → start'],['SS','Start → start'],['FF','Finish → finish'],['SF','Start → finish']];
function Label({children,secondary=false,size=13,style}){return <Text style={[{fontSize:size,lineHeight:size+6,color:secondary?C.muted:C.ink,fontWeight:secondary?'400':'500'},style]}>{children}</Text>}
function Action({name,onPress,active=false,danger=false,disabled=false}){return <Pressable accessibilityRole="button" accessibilityLabel={name} disabled={disabled} onPress={onPress} style={({pressed})=>({paddingHorizontal:12,minHeight:40,justifyContent:'center',borderRadius:8,backgroundColor:active?C.purpleDim:C.panel2,borderWidth:1,borderColor:active?C.purple:C.border,opacity:disabled?.4:pressed?.7:1})}><Label size={12} style={{color:danger?C.red:active?C.purple:C.ink}}>{name}</Label></Pressable>}
function Section({name,description,children}){return <View style={{paddingVertical:16,borderBottomWidth:1,borderBottomColor:C.border,gap:12}}><View style={{gap:4}}><Label size={15}>{name}</Label>{description&&<Label secondary size={12}>{description}</Label>}</View>{children}</View>}
export default function SchedulingPanel({visible,project,onClose,onCalendar,onTypedLink,onPreview,onApply,previewInfo,onClearPreview}){
 const {width}=useWindowDimensions();
 const [search,setSearch]=useState('');const [anchor,setAnchor]=useState('');const [exceptionDate,setExceptionDate]=useState('');
 const [exceptionType,setExceptionType]=useState('closed');
 const settings=project?.scheduling||{calendar:{mode:'calendar',weekdays:[1,2,3,4,5],closed:[],opened:[]},links:[]};
 const calendar=settings.calendar;const links=settings.links;
 const tasks=project?.tasks||[];
 const audit=useMemo(()=>{try{return project?scheduling.audit(project):{issues:[]}}catch(e){return {issues:[{code:'invalid_schedule',detail:e.message}]}}},[project]);
 const selected=tasks.some(t=>t.id===anchor)?anchor:(tasks.find(t=>t.start&&t.due)||tasks.find(t=>t.due)||tasks[0])?.id||'';
 const choices=useMemo(()=>tasks.filter(t=>!search||`${t.id} ${t.title}`.toLowerCase().includes(search.toLowerCase())).slice(0,25),[tasks,search]);
 const changeCalendar=patch=>onCalendar({...calendar,...patch});
 const addException=()=>{
  const value=exceptionDate.trim();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value)){onCalendar({...calendar,[exceptionType]:[...calendar[exceptionType],value]});return;}
  changeCalendar({[exceptionType]:[...new Set([...calendar[exceptionType],value])],
   [exceptionType==='closed'?'opened':'closed']:calendar[exceptionType==='closed'?'opened':'closed'].filter(v=>v!==value)});
  setExceptionDate('');
 };
 const isStale=!!previewInfo&&previewInfo.projectId!==project?.id;
 return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><SafeAreaProvider style={{flex:1}}><SafeAreaView edges={['top','bottom','left','right']} style={{flex:1}}>
  <View style={{flex:1,backgroundColor:'#000b',justifyContent:'center',alignItems:'center',padding:width<650?8:24}}>
   <View style={{maxWidth:700,width:'100%',maxHeight:'95%',backgroundColor:C.panel,borderRadius:14,borderColor:C.border,borderWidth:1,overflow:'hidden'}}>
    <View style={{padding:16,flexDirection:'row',alignItems:'center',gap:12,borderBottomWidth:1,borderBottomColor:C.border}}>
     <Ionicons name="calendar-outline" size={20} color={C.purple}/>
     <View style={{flex:1,gap:2}}><Label size={17}>Schedule project</Label><Label secondary size={11}>{project?.name} · Preview before moving dependent tasks</Label></View>
     <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close scheduling"><Ionicons name="close-outline" size={24} color={C.sub}/></Pressable>
    </View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingHorizontal:16,paddingBottom:24}}>
     <Section name="Working calendar" description="Applies to this project. Changing the calendar does not move existing dates">
      <View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}><Action name="Calendar days" active={calendar.mode==='calendar'} onPress={()=>changeCalendar({mode:'calendar'})}/><Action name="Working days" active={calendar.mode==='workdays'} onPress={()=>changeCalendar({mode:'workdays'})}/></View>
      {calendar.mode==='workdays'&&<><Label secondary size={12}>Workdays</Label><View style={{flexDirection:'row',gap:6,flexWrap:'wrap'}}>{WEEK.map((day,i)=><Action key={day} name={day} active={calendar.weekdays.includes(i+1)} onPress={()=>{const days=calendar.weekdays.includes(i+1)?calendar.weekdays.filter(v=>v!==i+1):[...calendar.weekdays,i+1].sort((a,b)=>a-b);changeCalendar({weekdays:days})}}/>)}</View>
       <Label secondary size={12}>Date exceptions (YYYY-MM-DD)</Label><View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}><Action name="Holiday" active={exceptionType==='closed'} onPress={()=>setExceptionType('closed')}/><Action name="Extra working day" active={exceptionType==='opened'} onPress={()=>setExceptionType('opened')}/></View>
       <View style={{flexDirection:'row',gap:8,alignItems:'center'}}><TextInput value={exceptionDate} onChangeText={setExceptionDate} placeholder="2026-12-25" placeholderTextColor={C.muted} autoCapitalize="none" accessibilityLabel="Exception date" style={{flex:1,minHeight:44,paddingHorizontal:12,borderRadius:8,borderColor:C.border,borderWidth:1,color:C.ink,backgroundColor:C.bg}}/><Action name="Add date" onPress={addException}/></View>
       {['closed','opened'].map(key=>calendar[key].map(date=><View key={key+date} style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8}}><Label size={12}>{key==='closed'?'Holiday':'Extra workday'} · {date}</Label><Action name="Remove" danger onPress={()=>changeCalendar({[key]:calendar[key].filter(v=>v!==date)})}/></View>))}</>}
     </Section>
     <Section name="Task relationships" description="Set relationship type and lead/lag. Changing a relationship reopens verification for dependent tasks">
      {!links.length&&<Label secondary size={12}>No task links yet. Connect tasks on the Gantt chart or from task details</Label>}
      {links.map(edge=>{
       const predecessor=tasks.find(t=>t.id===edge.predecessorId),successor=tasks.find(t=>t.id===edge.successorId);
       return <View key={`${edge.predecessorId}-${edge.successorId}`} style={{padding:12,borderRadius:10,borderWidth:1,borderColor:C.border,gap:10,backgroundColor:C.bg}}>
        <Label size={12}>{predecessor?.title||edge.predecessorId} → {successor?.title||edge.successorId}</Label>
        <View style={{flexDirection:'row',gap:6,flexWrap:'wrap'}}>{TYPES.map(([kind,label])=><Action key={kind} name={label} active={edge.type===kind} onPress={()=>onTypedLink(edge.predecessorId,edge.successorId,kind,edge.lagDays)}/>)}</View>
        <View style={{flexDirection:'row',alignItems:'center',gap:10}}><Label secondary size={12}>Lag (days)</Label><Action name="−" onPress={()=>onTypedLink(edge.predecessorId,edge.successorId,edge.type,edge.lagDays-1)} disabled={edge.lagDays<=-365}/><Label size={14}>{edge.lagDays>0?'+':''}{edge.lagDays}</Label><Action name="+" onPress={()=>onTypedLink(edge.predecessorId,edge.successorId,edge.type,edge.lagDays+1)} disabled={edge.lagDays>=365}/></View>
       </View>;
      })}
     </Section>
     <Section name="Schedule health" description="Review conflicts before applying changes. Imported dates are never shifted automatically">
      <Label size={13} style={{color:audit.issues.length?C.amber:C.green}}>{audit.issues.length?`${audit.issues.length} scheduling issue(s)`:'No scheduling conflicts detected'}</Label>
      {audit.issues.slice(0,8).map((issue,i)=><Label key={i} size={12} secondary>{issue.code.replace(/_/g,' ')} · {issue.taskId||''} {issue.predecessorId?`← ${issue.predecessorId}`:''} {issue.earliestStart?`Earliest ${issue.earliestStart}`:''}</Label>)}
      {audit.issues.length>8&&<Label secondary size={11}>+ {audit.issues.length-8} additional issues</Label>}
     </Section>
     <Section name="Reschedule successors" description="Select an edited task. Preview shifts successors later if their dependencies require it. No changes are made until you apply">
      <Label secondary size={12}>Changed task (anchor)</Label>
      <View style={{padding:10,borderRadius:8,borderColor:C.border,borderWidth:1}}><Label size={13}>{tasks.find(t=>t.id===selected)?.title||'No tasks available'}</Label></View>
      <TextInput value={search} onChangeText={setSearch} placeholder="Find another task" placeholderTextColor={C.muted} accessibilityLabel="Find anchor task" style={{height:44,paddingHorizontal:12,borderWidth:1,borderColor:C.border,borderRadius:8,color:C.ink,backgroundColor:C.bg}}/>
      <View style={{maxHeight:160}}><ScrollView nestedScrollEnabled>{choices.map(task=><Pressable key={task.id} onPress={()=>{setAnchor(task.id);setSearch('');onClearPreview()}} style={{paddingVertical:10,paddingHorizontal:12,borderBottomWidth:1,borderColor:C.border,backgroundColor:task.id===selected?C.purpleDim:'transparent'}}><Label size={12}>{task.id} · {task.title}</Label></Pressable>)}</ScrollView></View>
      <Action name="Preview successor dates" onPress={()=>onPreview(selected)} disabled={!selected}/>
      {previewInfo&&!isStale&&<View style={{padding:12,borderRadius:10,borderWidth:1,borderColor:C.border,gap:10}}>
       <Label size={13}>{previewInfo.preview.issues.length?`${previewInfo.preview.issues.length} scheduling issue(s)`:previewInfo.preview.changes.length?`${previewInfo.preview.changes.length} proposed date change(s)`:'No successors need moving'}</Label>
       {previewInfo.preview.changes.map(c=><Label key={c.taskId} size={12}>{c.taskId}: {c.oldStart||c.oldDue} – {c.oldDue||c.oldStart} → {c.newStart||c.newDue} – {c.newDue}</Label>)}
       {previewInfo.preview.issues.slice(0,30).map((issue,i)=><Label key={i} size={12} style={{color:C.amber}}>{issue.code.replace(/_/g,' ')} · {issue.taskId||''} {issue.predecessorId?`← ${issue.predecessorId}`:''} {issue.detail||''}</Label>)}
       {previewInfo.preview.canApply&&previewInfo.preview.changes.length>0&&<Action name="Apply changes and save recovery snapshot" active onPress={onApply}/>}
       <Action name="Discard preview" onPress={onClearPreview}/>
      </View>}
     </Section>
     <Label secondary size={11} style={{marginTop:16}}>Assumptions: discrete inclusive dates; no resource leveling or automatic cloud synchronization. Existing task dates are not modified on import or calendar changes</Label>
    </ScrollView>
   </View>
  </View>
 </SafeAreaView></SafeAreaProvider></Modal>;
}
