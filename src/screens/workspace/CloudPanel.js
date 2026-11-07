// /src/screens/workspace/CloudPanel.js
import {useEffect,useState} from 'react';
import {View} from 'react-native';
import {Button,Input,T,SectionTitle,downloadText} from '../../ui/ui';
import {DangerConfirm,Fold,Pick} from '../../components/inline/CompactTools';
import {useStoreActions} from '../../store/store';
import CloudRecovery from './CloudRecovery';
import CloudOrganization from './CloudOrganization';
import CloudPlatform from './CloudPlatform';
const {ROLES}=require('../../cloud/iam.cjs');
function CloudPanelContent({api,session,state}){
 const [host,setHost]=useState('127.0.0.1'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[orgId,setOrgId]=useState(''),[workspaceId,setWorkspaceId]=useState('main');
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),[admin,setAdmin]=useState(null),[platform,setPlatform]=useState(null),[uid,setUid]=useState(''),[role,setRole]=useState('viewer'),[capacity,setCapacity]=useState('5'),[invitation,setInvitation]=useState('');
 const [projectId,setProjectId]=useState(''),[inviteToken,setInviteToken]=useState(''),[summaries,setSummaries]=useState(null),[guest,setGuest]=useState(false);

 const run=async fn=>{setBusy(true);setError('');try{await fn();}catch(e){setError(e.message);}finally{setBusy(false);}};
 const connect=(publish,create=false)=>run(async()=>{if(!(await api.flush()))throw Error('Save the local workspace before connecting');await session.connect({host,email,password,orgId:orgId.trim(),workspaceId:workspaceId.trim(),publish,create});setPassword('');});
 const loadAdmin=async()=>setAdmin(await session.request({action:'admin'}));
 return <View style={{gap:16}}>
  <T>Local Firebase emulator</T>
  <T muted size={13}>Connect a local copy for collaboration testing. Existing backups stay on this device. Billing is simulated.</T>
  <T muted size={12}>demo-milvayo-083 · build 0.8.4</T>
  {state.connected?<>
   <T>{state.scope.orgId} / {state.scope.workspaceId}</T>
   <T>{state.pending} pending · {state.conflicts} conflicts</T>
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
    <Button label="Synchronize" disabled={busy||state.busy} onPress={()=>run(()=>session.tick())}/>
    <Button label="Disconnect" variant="secondary" disabled={busy||state.busy} onPress={()=>run(()=>session.disconnect())}/>
    <Button label="Export sync recovery" variant="secondary" disabled={busy||state.busy} onPress={()=>run(()=>downloadText('milvayo-sync-recovery.json',JSON.stringify(session.exportJournal()),'application/json'))}/>
   </View>
   {state.measured?<T muted size={12}>Last pull: {Number.isFinite(state.measured.documentReads)?`${state.measured.documentReads} local document reads · `:''}{state.measured.bytes} bytes</T>:null}
   <Fold title="Organization administration" subtitle="Members, scoped roles and simulated seats">
    <View style={{gap:12}}>
     <Button label="Load authorized administration" variant="secondary" disabled={busy||state.busy} onPress={()=>run(loadAdmin)}/>
     {admin?<>
      <T>{admin.members.length} members · {admin.subscription.seats.length} / {admin.subscription.capacity} simulated seats</T>
      {admin.members.map(m=><T key={m.uid} size={13}>{m.uid} · {m.role} · {m.active?'active':'revoked'}</T>)}
      <Input value={uid} onChangeText={setUid} placeholder="Member UID" accessibilityLabel="Member UID"/>
      <Pick values={['none',...Object.keys(ROLES)]} value={role} onChange={setRole}/>
      <Button label="Apply workspace role" disabled={busy||state.busy||!uid.trim()} onPress={()=>run(async()=>{await session.request({action:'grant',uid:uid.trim(),grant:{workspaceRole:role,projects:admin.grants.find(g=>g.uid===uid.trim())?.projects||{}}});await loadAdmin();})}/>
      <Input value={projectId} onChangeText={setProjectId} placeholder="Project ID" accessibilityLabel="Project for scoped role"/>
      <Button label="Apply project role" variant="secondary" disabled={busy||state.busy||!uid.trim()||!projectId.trim()} onPress={()=>run(async()=>{const old=admin.grants.find(g=>g.uid===uid.trim());await session.request({action:'grant',uid:uid.trim(),grant:{workspaceRole:old?.workspaceRole||'none',projects:{...old?.projects,[projectId.trim()]:role}}});await loadAdmin();})}/>
      {uid.trim()?<DangerConfirm label="Revoke member" onConfirm={()=>run(async()=>{await session.request({action:'revoke',uid:uid.trim()});await loadAdmin();})}/>:null}
      <Pick values={[{value:false,label:'Licensed member'},{value:true,label:'Guest'}]} value={guest} onChange={setGuest}/>
      <Button label="Create invitation for UID" variant="secondary" disabled={busy||state.busy||!uid.trim()} onPress={()=>run(async()=>setInvitation((await session.request({action:'invite',uid:uid.trim(),guest,grant:{workspaceRole:role,projects:{}}})).token))}/>
      {invitation?<T selectable size={12}>Invitation: {invitation}</T>:null}
      <Input value={capacity} onChangeText={setCapacity} keyboardType="numeric" accessibilityLabel="Simulated seat capacity"/>
      <Button label="Set simulated capacity" variant="secondary" disabled={busy||state.busy} onPress={()=>run(async()=>{await session.request({action:'subscription',capacity:Number(capacity)});await loadAdmin();})}/>
      <SectionTitle>Recent authorized changes</SectionTitle>
      {admin.audit.map(e=><T key={e.id} muted size={12}>{e.action} · {e.actor}</T>)}
     </>:null}
    </View>
   </Fold>
   <Fold title="Organization tools" subtitle="Structure, licenses, profiles and simulated billing"><CloudOrganization session={session}/></Fold>
   <Fold title="Project summaries" subtitle="Authorized task and Canvas counts">
    <Button label="Load project summaries" variant="secondary" disabled={busy||state.busy} onPress={()=>run(async()=>setSummaries((await session.request({action:'summaries'})).summaries))}/>
    {summaries?.map(s=><T key={s.projectId} size={13}>{s.projectId} · {s.taskCount} tasks · {s.statusCounts.Done} done · {s.canvasObjects} Canvas objects</T>)}
   </Fold>
   <Fold title="Platform administration" subtitle="Service metadata requires a separate platform role">
    <View style={{gap:12}}>
     <Button label="Load platform overview" variant="secondary" disabled={busy||state.busy} onPress={()=>run(async()=>setPlatform(await session.request({action:'platform'})))}/>
     {platform?<><T>{platform.organizations.length} local organizations · {platform.role}</T>{platform.organizations.map(o=><T key={o.id} size={13}>{o.name}</T>)}</>:null}
     <CloudPlatform session={session}/>
    </View>
   </Fold>
   {session.clientMetrics()?<T muted size={12}>Presence payloads: {session.clientMetrics().presenceUpdates} updates · {session.clientMetrics().uploadPayloadBytes} bytes up · {session.clientMetrics().downloadPayloadBytes} bytes down</T>:null}
   <Button label="Export authorized cloud backup" variant="secondary" disabled={busy||state.busy} onPress={()=>run(async()=>downloadText('milvayo-cloud-backup.json',JSON.stringify(await session.request({action:'backup'})),'application/json'))}/>
   <Fold title="Cloud recovery" subtitle="Validate and preview a task, project or workspace restore"><CloudRecovery session={session}/></Fold>
  </>:<View style={{gap:12}}>
   <Input value={host} onChangeText={setHost} autoCapitalize="none" placeholder="127.0.0.1" accessibilityLabel="Private emulator host"/>
   <Input value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Email" accessibilityLabel="Emulator account email"/>
   <Input value={password} onChangeText={setPassword} secure placeholder="Password" accessibilityLabel="Emulator account password"/>
   <Input value={orgId} onChangeText={setOrgId} autoCapitalize="none" placeholder="Personal organization (leave blank)" accessibilityLabel="Cloud organization ID"/>
   <Input value={workspaceId} onChangeText={setWorkspaceId} autoCapitalize="none" placeholder="Cloud workspace ID" accessibilityLabel="Cloud workspace ID"/>
   <T muted size={12}>Publish sends this workspace explicitly. Open saves a recovery snapshot before loading remote work. Signing in is required again after restart.</T>
   <Button label="Sign in and publish this workspace" disabled={busy||state.busy} onPress={()=>connect(true)}/>
   <Button label="Create emulator account and publish" variant="secondary" disabled={busy||state.busy} onPress={()=>connect(true,true)}/>
   <Button label="Sign in and open cloud workspace" variant="secondary" disabled={busy||state.busy} onPress={()=>connect(false)}/>
   <Fold title="Accept an invitation" subtitle="Use your emulator email, password and organization above">
    <Input value={inviteToken} onChangeText={setInviteToken} placeholder="Invitation token" accessibilityLabel="Local invitation token"/>
    <Button label="Accept invitation" variant="secondary" disabled={busy||state.busy||!orgId.trim()||!inviteToken.trim()} onPress={()=>run(async()=>{const client=await require('../../cloud/client').createEmulatorClient(host);try{await client.login(email.trim(),password);const result=await client.request({action:'accept',orgId:orgId.trim(),token:inviteToken.trim()});setWorkspaceId(result.workspaceId);setInviteToken('');}finally{await client.close();}})}/>
   </Fold>
  </View>}
  {error||state.error?<T accessibilityRole="alert">{error||state.error}</T>:null}
 </View>;
}

export default function CloudPanel(){const api=useStoreActions(),session=api.cloudSession(),[state,setState]=useState(session.getState);useEffect(()=>session.subscribe(setState),[session]);return <CloudPanelContent key={[state.scope?.uid||'local',state.scope?.orgId,state.scope?.workspaceId,state.membershipRole,state.grant?.version].join('/')} api={api} session={session} state={state}/>;}
