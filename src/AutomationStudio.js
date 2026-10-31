import React,{useState} from 'react';
import {View,Text,TextInput,Pressable,ScrollView} from 'react-native';
import automation from './automation.cjs';
import boards from './boards.cjs';
import design from './design.cjs';
const C=design.colors;
const card={padding:16,borderRadius:12,backgroundColor:C.panel,borderColor:C.border,borderWidth:1,marginBottom:12};
function Label({children,muted=false}){return <Text style={{fontSize:12,lineHeight:18,color:muted?C.muted:C.ink}}>{children}</Text>}
function Action({name,onPress,selected=false,danger=false,disabled=false}){return <Pressable accessibilityRole="button" accessibilityLabel={name} onPress={onPress} disabled={disabled} style={({pressed})=>({minHeight:44,justifyContent:'center',paddingHorizontal:12,borderRadius:8,borderWidth:1,borderColor:selected?C.accent:C.border,backgroundColor:selected?C.purpleDim:C.panel2,opacity:disabled?.4:pressed?.7:1})}><Text style={{fontSize:12,fontWeight:selected?'700':'500',color:danger?C.red:selected?C.accent:C.ink}}>{name}</Text></Pressable>}
function Choices({items,value,onChange}){return <View style={{flexDirection:'row',gap:8,flexWrap:'wrap',marginVertical:8}}>{items.map(([k,n])=><Action key={k} name={n} selected={k===value} onPress={()=>onChange(k)}/>)}</View>}
function Input({label,value,onChange,placeholder}){return <View style={{marginVertical:8}}><Label muted>{label}</Label><TextInput accessibilityLabel={label} value={String(value??'')} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={C.muted} style={{height:44,borderColor:C.border,borderWidth:1,borderRadius:8,backgroundColor:C.panel2,paddingHorizontal:12,color:C.ink,marginTop:6}}/></View>}
const defaults={name:'New automation',trigger:'status',status:'Validation',daysBefore:0,boardId:'',priorityFilter:'Any',enabled:true,actions:[{type:'priority',value:'High'}]};
const suggested=[['priority','High'],['owner','QA lead'],['stage','Testing'],['addLabel','needs-review'],['dueDays','3'],['comment','Ready for review']];
export default function AutomationStudio({project,onChange,onRun}){
 const [editing,setEditing]=useState(null),[draft,setDraft]=useState(defaults),[error,setError]=useState('');
 const boardsList=boards.normalizedBoards(project);
 const start=(rule)=>{setDraft(rule?JSON.parse(JSON.stringify(rule)):{...defaults,id:'auto-'+Date.now(),actions:[...defaults.actions]});setEditing(rule?.id||'new');setError('');};
 const apply=()=>{try{onChange(automation.saveCommand(project,draft),'Saved automation command');setEditing(null);setError('')}catch(e){setError(e.message)}};
 const add=(type)=>setDraft(x=>({...x,actions:[...x.actions,{type,value:suggested.find(a=>a[0]===type)?.[1]||''}]}));
 const setAction=(i,patch)=>setDraft(x=>({...x,actions:x.actions.map((a,j)=>i===j?{...a,...patch}:a)}));
 const commands=project.automationCommands||[];
 return <View style={{gap:10}}>
  <View style={[card,{gap:8}]}><Text style={{color:C.ink,fontSize:17,fontWeight:'700'}}>Automation studio</Text><Label muted>Local rules, card buttons, board buttons and due-date checks. Nothing runs in the background.</Label>
   <View style={{alignItems:'flex-start'}}><Action name="Create automation" selected onPress={()=>start()}/></View>
  </View>
  {error?<View style={card}><Text style={{color:C.red}}>{error}</Text></View>:null}
  {editing&&<View style={card}>
   <Text style={{color:C.ink,fontWeight:'700',fontSize:15,marginBottom:8}}>{editing==='new'?'Create command':'Edit command'}</Text>
   <Input label="Automation name" value={draft.name} onChange={name=>setDraft(x=>({...x,name}))}/>
   <Label muted>Trigger</Label><Choices items={[['status','Card enters status'],['cardButton','Card button'],['boardButton','Board button'],['due','Due date']]} value={draft.trigger} onChange={trigger=>setDraft(x=>({...x,trigger}))}/>
   {draft.trigger==='status'&&<><Label muted>Enter status</Label><Choices items={['Backlog','In progress','Validation','Done'].map(s=>[s,s])} value={draft.status} onChange={status=>setDraft(x=>({...x,status}))}/></>}
   {draft.trigger==='due'&&<Input label="Days before due date (0–365)" value={String(draft.daysBefore)} onChange={daysBefore=>setDraft(x=>({...x,daysBefore:Number(daysBefore)}))}/>}
   <Label muted>Apply to board</Label><Choices items={ [['','Any board'],...boardsList.map(b=>[b.id,b.name])]} value={draft.boardId} onChange={boardId=>setDraft(x=>({...x,boardId}))}/>
   <Label muted>Optional priority condition</Label><Choices items={['Any','Low','Medium','High','Critical'].map(n=>[n,n])} value={draft.priorityFilter} onChange={priorityFilter=>setDraft(x=>({...x,priorityFilter}))}/>
   <Text style={{color:C.ink,fontWeight:'700',marginVertical:8}}>Actions · {(draft.actions||[]).length}/8</Text>
   {draft.actions.map((a,i)=><View key={i} style={{padding:12,backgroundColor:C.panel2,borderRadius:8,marginBottom:8}}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><Label>{i+1}. {a.type}</Label><Action name="Remove" danger disabled={draft.actions.length===1} onPress={()=>setDraft(x=>({...x,actions:x.actions.filter((_,j)=>j!==i)}))}/></View>
    <Choices items={suggested.map(([key])=>[key,key])} value={a.type} onChange={type=>setAction(i,{type,value:suggested.find(x=>x[0]===type)?.[1]||''})}/>
    <Input label="Value" value={a.value} onChange={value=>setAction(i,{value})}/>
   </View>)}
   <View style={{flexDirection:'row',gap:8,flexWrap:'wrap',marginBottom:12}}><Action name="Add action" onPress={()=>add('addLabel')} disabled={draft.actions.length>=8}/><Action name="Save command" selected onPress={apply}/><Action name="Cancel" onPress={()=>setEditing(null)}/></View>
  </View>}
  {commands.map(c=><View key={c.id} style={card}><View style={{flexDirection:'row',justifyContent:'space-between',gap:6,alignItems:'center'}}><Text style={{fontWeight:'700',fontSize:14,color:C.ink,flex:1}}>{c.name}</Text><Label muted>{c.enabled?'On':'Off'}</Label></View>
   <Label muted>{c.trigger==='status'?`When moved to ${c.status}`:c.trigger==='due'?`${c.daysBefore} day(s) before due`:c.trigger==='boardButton'?'Board button':'Card button'} · {c.actions.map(a=>a.type).join(' + ')}</Label>
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:12}}><Action name="Edit" onPress={()=>start(c)}/><Action name={c.enabled?'Pause':'Enable'} onPress={()=>onChange(automation.saveCommand(project,{...c,enabled:!c.enabled}),'Changed automation state')}/><Action name="Delete" danger onPress={()=>onChange(automation.deleteCommand(project,c.id),'Deleted automation command')}/>
   {c.trigger==='boardButton'&&<Action name="Run on board" selected onPress={()=>onRun({type:'boardButton',ruleId:c.id})}/>}</View>
  </View>)}
  <View style={card}><Text style={{color:C.ink,fontWeight:'700',marginBottom:8}}>Due-date checks</Text><Label muted>Run manually while offline. Each matching command runs once per task per day; no recurring background promises.</Label><View style={{alignItems:'flex-start',marginTop:10}}><Action name="Run due checks now" onPress={()=>onRun({type:'due'})}/></View></View>
  <View style={card}><Text style={{color:C.ink,fontWeight:'700',marginBottom:8}}>Execution history</Text>{(project.automationHistory||[]).length===0?<Label muted>No commands executed yet.</Label>:<ScrollView style={{maxHeight:220}}>{project.automationHistory.slice(0,25).map(h=><View key={h.id} style={{paddingVertical:7,borderBottomColor:C.border,borderBottomWidth:1}}><Label>{h.summary} · {h.taskId}</Label><Label muted>{h.at.slice(0,16)} · {h.event}</Label></View>)}</ScrollView>}</View>
 </View>;
}
