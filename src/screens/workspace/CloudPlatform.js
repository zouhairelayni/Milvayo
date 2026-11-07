// /src/screens/workspace/CloudPlatform.js
import {useState} from 'react';
import {View} from 'react-native';
import {Button,Input,T} from '../../ui/ui';
import {Pick} from '../../components/inline/CompactTools';
export default function CloudPlatform({session}){
 const [data,setData]=useState(null),[release,setRelease]=useState('0.8.4'),[flag,setFlag]=useState('collaboration'),[enabled,setEnabled]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[uid,setUid]=useState(''),[role,setRole]=useState('support');
 const run=async fn=>{setBusy(true);setError('');try{await fn();}catch(e){setError(e.message);}finally{setBusy(false);}};
 const load=async()=>{const next=await session.request({action:'platformOperations'});setData(next);setRelease(next.configuration.release);};
 return <View style={{gap:12}}>
  <Button label="Load local operations" variant="secondary" disabled={busy} onPress={()=>run(load)}/>
  {data?<>
   <T muted size={12}>{data.scope}</T>
   <T>{data.workerTelemetry.requests} observed requests · {data.workerTelemetry.failed} failures</T>
   <T muted size={12}>Recorded responses: {data.workerTelemetry.recordedReads} document reads · {data.workerTelemetry.recordedWrites} writes</T>
   <T muted size={12}>Handler p50 {Math.round(data.workerTelemetry.p50Ms||0)} ms · p95 {Math.round(data.workerTelemetry.p95Ms||0)} ms · {data.workerTelemetry.sampleCount} samples</T>
   <T muted size={12}>Worker heap: {Math.round(data.workerTelemetry.heapBytes/1024/1024)} MiB</T>
   <T muted size={12}>{data.workerTelemetry.scope}</T>
   <T muted size={12}>Storage traffic: {data.workerTelemetry.storageTraffic}. Production costs: {data.workerTelemetry.productionCosts}.</T>
   <Input value={release} onChangeText={setRelease} accessibilityLabel="Local release configuration"/>
   <Input value={flag} onChangeText={setFlag} placeholder="Feature name" accessibilityLabel="Local feature flag name"/>
   <Pick values={[{value:false,label:'Off'},{value:true,label:'On'}]} value={enabled} onChange={setEnabled}/>
   <Button label="Save emulator configuration" disabled={busy||!flag.trim()} onPress={()=>run(async()=>{await session.request({action:'platformConfigure',release,flags:{...data.configuration.flags,[flag.trim()]:enabled}});await load();})}/>
   <T muted size={12}>Saved in the local service configuration. Project release verification keeps its existing gates.</T>
   <Input value={uid} onChangeText={setUid} placeholder="Local account UID" accessibilityLabel="Platform role account UID"/>
   <Pick values={['owner','security','operations','billing','release','support','none']} value={role} onChange={setRole}/>
   <Button label="Save platform application role" disabled={busy||!uid.trim()} onPress={()=>run(async()=>{await session.request({action:'platformRole',uid:uid.trim(),role});await load();})}/>
   <T muted size={12}>Platform roles do not grant access to private workspaces.</T>
   {data.audit.map(a=><T key={a.id} muted size={12}>{a.action} · {a.actor}</T>)}
  </>:null}
  {error?<T accessibilityRole="alert">{error}</T>:null}
 </View>;
}
