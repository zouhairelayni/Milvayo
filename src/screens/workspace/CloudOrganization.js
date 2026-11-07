// /src/screens/workspace/CloudOrganization.js
import {useState} from 'react';
import {View} from 'react-native';
import * as Crypto from 'expo-crypto';
import {Button,Input,T} from '../../ui/ui';
import {DangerConfirm,Fold,Pick} from '../../components/inline/CompactTools';
export default function CloudOrganization({session}){
 const [structure,setStructure]=useState(null),[family,setFamily]=useState('teams'),[id,setId]=useState(''),[name,setName]=useState(''),[members,setMembers]=useState(''),[departmentId,setDepartmentId]=useState(''),[uid,setUid]=useState(''),[role,setRole]=useState('member'),[allocation,setAllocation]=useState(''),[cap,setCap]=useState('5'),[days,setDays]=useState('90'),[displayName,setDisplayName]=useState(''),[organizationName,setOrganizationName]=useState(''),[createdOrg,setCreatedOrg]=useState(''),[billing,setBilling]=useState(null),[eventType,setEventType]=useState('payment-failed'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[result,setResult]=useState('');
 const run=async fn=>{setBusy(true);setError('');setResult('');try{await fn();}catch(e){setError(e.message);}finally{setBusy(false);}};
 const load=async()=>setStructure(await session.request({action:'organizationStructure'}));
 return <View style={{gap:12}}>
  <Fold title="Shared display name" subtitle="Shown only to authorized project members">
   <Input value={displayName} onChangeText={setDisplayName} accessibilityLabel="Cloud display name" placeholder="Your name"/>
   <Button label="Save display name" disabled={busy||!displayName.trim()} onPress={()=>run(async()=>{await session.request({action:'profile',name:displayName.trim()});setResult('Display name saved');})}/>
  </Fold>
  <Fold title="Teams and departments" subtitle="Organization structure is separate from project access">
   <Button label="Load organization structure" variant="secondary" disabled={busy} onPress={()=>run(load)}/>
   {structure?<>
    <T>{structure.teams.length} teams · {structure.departments.length} departments · {structure.workspaces.length} workspaces</T>
    <Pick values={['teams','departments']} value={family} onChange={setFamily}/>
    {structure[family].map(g=><Button key={g.id} label={g.name} variant="ghost" onPress={()=>{setId(g.id);setName(g.name);setMembers(g.members.join(', '));setDepartmentId(g.departmentId);}}/>)}
    <Input value={id} onChangeText={setId} placeholder="Group ID" accessibilityLabel="Organization group ID"/>
    <Input value={name} onChangeText={setName} placeholder="Name" accessibilityLabel="Organization group name"/>
    <Input value={members} onChangeText={setMembers} placeholder="Member UIDs, separated by commas" accessibilityLabel="Group member UIDs"/>
    {family==='teams'?<Input value={departmentId} onChangeText={setDepartmentId} placeholder="Department ID (optional)" accessibilityLabel="Team department ID"/>:null}
    <Button label="Save group" disabled={busy||!id.trim()||!name.trim()} onPress={()=>run(async()=>{await session.request({action:'groupSave',kind:family,id:id.trim(),name:name.trim(),members:members.split(',').map(v=>v.trim()).filter(Boolean),departmentId:family==='teams'?departmentId.trim():''});await load();})}/>
    {id.trim()?<DangerConfirm label="Delete group" onConfirm={()=>run(async()=>{await session.request({action:'groupDelete',kind:family,id:id.trim()});setId('');setName('');setMembers('');await load();})}/>:null}
    {structure.audit.map(a=><T key={a.id} muted size={12}>{a.action} · {a.actor}</T>)}
   </>:null}
  </Fold>
  <Fold title="Organization roles and license pools" subtitle="One licensed person can work in several projects">
   <Input value={uid} onChangeText={setUid} placeholder="Member UID" accessibilityLabel="License and organization-role member UID"/>
   <Pick values={['owner','admin','billing','member','guest']} value={role} onChange={setRole}/>
   <Button label="Change organization role" variant="secondary" disabled={busy||!uid.trim()} onPress={()=>run(async()=>{await session.request({action:'memberRole',uid:uid.trim(),role});setResult('Organization role saved');})}/>
   <Input value={allocation} onChangeText={setAllocation} placeholder="Allocation scope (project or portfolio ID)" accessibilityLabel="Seat allocation scope"/>
   <Input value={cap} onChangeText={setCap} keyboardType="numeric" accessibilityLabel="Resource seat cap"/>
   <Button label="Set allocation cap" variant="secondary" disabled={busy||!allocation.trim()} onPress={()=>run(async()=>{await session.request({action:'seatCap',scope:allocation.trim(),capacity:Number(cap)});setResult('Allocation cap saved');})}/>
   <Button label="Allocate licensed seat" disabled={busy||!uid.trim()||!allocation.trim()} onPress={()=>run(async()=>{await session.request({action:'seatAllocation',uid:uid.trim(),scope:allocation.trim(),enabled:true});setResult('Licensed seat allocated');})}/>
   <Button label="Remove resource allocation" variant="secondary" disabled={busy||!uid.trim()||!allocation.trim()} onPress={()=>run(async()=>{await session.request({action:'seatAllocation',uid:uid.trim(),scope:allocation.trim(),enabled:false});setResult('Resource allocation removed; organization license retained');})}/>
   {uid.trim()?<DangerConfirm label="Release licensed seat" onConfirm={()=>run(async()=>{await session.request({action:'seatRelease',uid:uid.trim()});setResult('License released; editing grants reduced to commenter');})}/>:null}
  </Fold>
  <Fold title="Billing simulation" subtitle="Signed mock events and local payment history">
   <Pick values={['payment-failed','payment-recovered','refund','capacity']} value={eventType} onChange={setEventType}/>
   <Button label="Apply simulated event" disabled={busy} onPress={()=>run(async()=>{const event={provider:'mock',id:Crypto.randomUUID(),type:eventType,at:Date.now(),...(eventType==='capacity'?{capacity:Number(cap)}:{})};await session.request({action:'mockWebhook',event,signature:require('../../cloud/mockPayments.cjs').sign(event)});setBilling((await session.request({action:'billingHistory'})).events);})}/>
   <Button label="Load simulated billing history" variant="secondary" disabled={busy} onPress={()=>run(async()=>setBilling((await session.request({action:'billingHistory'})).events))}/>
   {billing?.map(e=><T key={e.id} muted size={12}>{e.event.type} · simulated · {e.actor}</T>)}
  </Fold>
  <Fold title="Retention policy" subtitle="Configure a local policy without deleting records">
   <Input value={days} onChangeText={setDays} keyboardType="numeric" accessibilityLabel="Configured retention days"/>
   <Button label="Save retention setting" disabled={busy} onPress={()=>run(async()=>{await session.request({action:'retention',days:Number(days)});setResult('Retention setting saved; no records were purged');})}/>
  </Fold>
  <Fold title="Create another organization" subtitle="An independent membership and license pool">
   <Input value={organizationName} onChangeText={setOrganizationName} placeholder="Organization name" accessibilityLabel="New organization name"/>
   <Button label="Create local organization" disabled={busy||!organizationName.trim()} onPress={()=>run(async()=>setCreatedOrg((await session.request({action:'organizationCreate',name:organizationName.trim(),mutationId:Crypto.randomUUID()})).orgId))}/>
   {createdOrg?<T selectable>Organization: {createdOrg}. Use this ID after disconnecting to publish a new workspace.</T>:null}
  </Fold>
  {result?<T>{result}</T>:null}{error?<T accessibilityRole="alert">{error}</T>:null}
 </View>;
}
