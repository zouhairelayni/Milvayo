// /src/screens/workspace/CloudRecovery.js
import {useState} from 'react';
import {View} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {File} from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import {strFromU8} from 'fflate';
import {Button,Input,T} from '../../ui/ui';
import {DangerConfirm} from '../../components/inline/CompactTools';
const {pickDocumentFileBytes,MAX_IMPORT_BYTES}=require('../../store/importFiles.cjs');
const {previewRestore}=require('../../cloud/recovery.cjs');
export default function CloudRecovery({session}){
 const [backup,setBackup]=useState(null),[plan,setPlan]=useState(null),[projectId,setProjectId]=useState(''),[taskId,setTaskId]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [newWorkspaceId,setNewWorkspaceId]=useState(''),[created,setCreated]=useState('');
 const run=async fn=>{setBusy(true);setError('');try{await fn();}catch(e){setError(e.message);}finally{setBusy(false);}};
 const pick=()=>run(async()=>{const selection=await DocumentPicker.getDocumentAsync({type:'application/json',copyToCacheDirectory:true,multiple:false});if(selection.canceled)return;const asset=selection.assets[0];if(asset.size>MAX_IMPORT_BYTES)throw Error('Backup exceeds 5 MB');const text=asset.file?await asset.file.text():strFromU8(await pickDocumentFileBytes(selection,File));setBackup(JSON.parse(text));setPlan(null);});
 const preview=()=>run(async()=>{if(session.getState().pending)throw Error('Resolve or export pending synchronization before restoring');const scope=session.getState().scope;if(backup.orgId!==scope.orgId||backup.workspaceId!==scope.workspaceId)throw Error('Choose a backup of this cloud workspace');const current=await session.request({action:'pull',cursor:0});setPlan(previewRestore(current.records,backup,{projectId:projectId.trim(),taskId:taskId.trim()}));});
 return <View style={{gap:12}}>
  <Button label="Choose cloud backup" variant="secondary" disabled={busy} onPress={pick}/>
  {backup?<>
   <Input value={projectId} onChangeText={v=>{setProjectId(v);setPlan(null);}} placeholder="Project ID (optional)" accessibilityLabel="Project to recover"/>
   <Input value={taskId} onChangeText={v=>{setTaskId(v);setPlan(null);}} placeholder="Task ID (optional)" accessibilityLabel="Task and related comments to recover"/>
   <Button label="Preview recovery" disabled={busy} onPress={preview}/>
  </>:null}
  {plan?<>
   <T>{plan.affected.length} record(s) will change</T>
   {plan.affected.slice(0,20).map(r=><T key={r.key} muted size={12}>{r.action} · {r.key}</T>)}
   {plan.changes.length>100?<T>Restore this complete backup into a new workspace, or choose a smaller scope for an atomic update here.</T>:plan.changes.length?<DangerConfirm label="Restore cloud records" onConfirm={()=>run(async()=>{await session.request({action:'commit',restore:true,mutationId:Crypto.randomUUID(),changes:plan.changes.map(c=>({...c,baseRevision:c.before?.revision||0}))});setPlan(null);await session.tick();})}/>:null}
   <Input value={newWorkspaceId} onChangeText={setNewWorkspaceId} placeholder="New cloud workspace ID" accessibilityLabel="New workspace for complete cloud recovery"/>
   {newWorkspaceId.trim()?<DangerConfirm label="Restore into new workspace" onConfirm={()=>run(async()=>{const result=await session.restoreNew(backup,newWorkspaceId.trim());setCreated(result.workspaceId);})}/>:null}
   {created?<T>Recovered workspace: {created}. Open it through the emulator connection controls. The source workspace is retained.</T>:null}
  </>:null}
  {error?<T accessibilityRole="alert">{error}</T>:null}
 </View>;
}
