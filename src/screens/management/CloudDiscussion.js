// /src/screens/management/CloudDiscussion.js
import {useEffect,useRef,useState} from 'react';
import {View} from 'react-native';
import {Button,Input,T} from '../../ui/ui';
import {Dropdown,Fold} from '../../components/inline/CompactTools';
import {useCloudSession} from '../../cloud/useCloudSession';
import {useCloudPresence} from '../../cloud/useCloudPresence';
function Discussion({project,openTask,session,state}){
 const [open,setOpen]=useState(false),[taskId,setTaskId]=useState(''),[body,setBody]=useState(''),[mention,setMention]=useState(''),[members,setMembers]=useState([]),[messages,setMessages]=useState([]),[notifications,setNotifications]=useState([]),[watching,setWatching]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[typing,setTyping]=useState(false),[memberCursor,setMemberCursor]=useState(null),[moreMembers,setMoreMembers]=useState(false),[oldest,setOldest]=useState(null),[hasOlder,setHasOlder]=useState(false);
 const threadId=taskId?'task-'+taskId:'project',token=project.id+'/'+threadId,current=useRef(token),cursor=useRef(0);current.current=token;
 const presence=useCloudPresence(project.id,open?'conversation:'+threadId:'',typing?'typing':false);
 useEffect(()=>{setTyping(!!body);if(!body)return;const timer=setTimeout(()=>setTyping(false),30000);return()=>clearTimeout(timer);},[body]);
 const scope={projectId:project.id,threadId,taskId};
 const load=async()=>{const expected=token;try{const result=await session.request({...scope,action:'messages',cursor:cursor.current,latest:cursor.current===0});if(current.current!==expected)return;cursor.current=Math.max(cursor.current,result.cursor);setMessages(old=>[...new Map([...old,...result.messages].map(m=>[m.id,m])).values()].sort((a,b)=>a.sequence-b.sequence));setWatching(result.watching);if(result.oldest!==null)setOldest(old=>old===null?result.oldest:Math.min(old,result.oldest));if(result.hasOlder!==undefined)setHasOlder(result.hasOlder);}catch(e){if(current.current===expected)setError(e.message);}};
 useEffect(()=>{cursor.current=0;setMessages([]);setMembers([]);setMention('');setOldest(null);setHasOlder(false);setError('');if(!state.connected||!open)return;void load();const timer=setInterval(()=>{void load();},3000);let active=true;session.request({...scope,action:'directory'}).then(r=>{if(active){setMembers(r.members);setMemberCursor(r.next);setMoreMembers(r.more);}}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;clearInterval(timer);};},[state.connected,open,token]);
 useEffect(()=>{if(state.connected&&open)void load();},[state.pending]);
 const run=async fn=>{setBusy(true);setError('');try{await fn();}catch(e){setError(e.message);}finally{setBusy(false);}};
 if(!state.connected)return null;
 const pending=session.pendingMessages(project.id,threadId),canComment=session.can('comment',project.id);
 return <Fold title="Cloud conversations" subtitle="Authenticated discussions, watchers and member notifications" open={open} onToggle={setOpen}>
  <View style={{gap:12}}>
   <Dropdown options={[{value:'',label:'Project discussion'},...project.tasks.map(t=>({value:t.id,label:t.title}))]} value={taskId} onChange={v=>{setTaskId(v);setBody('');}}/>
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}><Button label="Refresh conversation" variant="secondary" disabled={busy} onPress={()=>run(load)}/><Button label={watching?'Stop watching':'Watch conversation'} variant="secondary" disabled={busy} onPress={()=>run(async()=>{const r=await session.request({...scope,action:'watch',enabled:!watching});setWatching(r.watching);})}/></View>
   {presence.typing?<T muted size={12}>Another member is typing</T>:presence.viewers?<T muted size={12}>{presence.viewers} other member(s) viewing</T>:null}
   {[...messages,...pending.filter(m=>!messages.some(s=>s.id===m.id))].map(m=><View key={m.id} style={{gap:4}}><T muted size={12}>{m.restored?'Restored message':members.find(v=>v.uid===m.actor)?.name||'Member '+m.actor.slice(0,8)}{m.pending?` · ${m.status==='conflict'?'Needs attention':'Pending synchronization'}`:''}</T><T>{m.body}</T></View>)}
   {hasOlder?<Button label="Load older messages" variant="secondary" disabled={busy} onPress={()=>run(async()=>{const result=await session.request({...scope,action:'messages',before:oldest});setMessages(old=>[...new Map([...result.messages,...old].map(m=>[m.id,m])).values()].sort((a,b)=>a.sequence-b.sequence));setOldest(result.oldest);setHasOlder(result.hasOlder);})}/>:null}
   {!messages.length&&!pending.length?<T muted>No messages in this conversation</T>:null}
   <Input value={body} onChangeText={setBody} multiline accessibilityLabel="Cloud message" placeholder="Write a message" editable={canComment}/>
   <T muted size={12}>Mention a member</T><Dropdown options={[{value:'',label:'No mention'},...members.map(m=>({value:m.uid,label:m.name}))]} value={mention} onChange={setMention}/>
   {moreMembers?<Button label="Load more members" variant="secondary" disabled={busy} onPress={()=>run(async()=>{const result=await session.request({...scope,action:'directory',after:memberCursor});setMembers(old=>[...new Map([...old,...result.members].map(m=>[m.uid,m])).values()]);setMemberCursor(result.next);setMoreMembers(result.more);})}/>:null}
   <Button label="Send message" disabled={busy||!canComment||!body.trim()||body.length>4000} onPress={()=>run(async()=>{await session.enqueueMessage({...scope,body,mentions:mention?[mention]:[]});setBody('');setMention('');})}/>
   {!canComment?<T muted size={12}>Your project role allows reading this conversation</T>:null}
   <Button label="Load my notifications" variant="secondary" disabled={busy} onPress={()=>run(async()=>setNotifications((await session.request({action:'notifications'})).notifications))}/>
   {notifications.map(n=><View key={n.id} style={{gap:4}}><T size={13}>{n.projectId===project.id?(project.tasks.find(t=>t.id===n.taskId)?.title||'Project discussion'):'Conversation in another authorized project'}{n.read?' · read':''}</T>{n.projectId===project.id?<Button label="Read conversation" variant="secondary" small onPress={()=>run(async()=>{await session.request({action:'notificationRead',id:n.id});setTaskId(n.taskId||'');setNotifications(old=>old.map(v=>v.id===n.id?{...v,read:true}:v));})}/>:null}{n.taskId&&n.projectId===project.id?<Button label="Open task" variant="ghost" small onPress={()=>openTask?.(n.taskId)}/>:null}</View>)}
   {error||state.error?<T accessibilityRole="alert">{error||state.error}</T>:null}
  </View>
 </Fold>;
}

export default function CloudDiscussion(props){const {session,state}=useCloudSession();return state.connected?<Discussion key={[state.scope?.uid,state.scope?.orgId,state.scope?.workspaceId,state.membershipRole,state.grant?.version,props.project.id].join('/')} {...props} session={session} state={state}/>:null;}
