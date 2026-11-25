// /src/screens/workspace/CloudDiagnostics.js
import {useEffect,useState} from 'react';
import {Platform,Text,View} from 'react-native';
import {Button,T,downloadText} from '../../ui/ui';
import {Fold} from '../../components/inline/CompactTools';
import {useTheme} from '../../ui/theme/theme';
const D=require('../../cloud/diagnostics.cjs');
// Measuring only (0.8.28). Both screens read what the session already does; they send nothing and change nothing.
function Report({text}){const {c}=useTheme();return <Text selectable style={{color:c.ink,fontSize:12,lineHeight:17,fontFamily:Platform.select({ios:'Menlo',android:'monospace',default:'monospace'})}}>{text}</Text>;}
const stamp=()=>new Date().toISOString().replace(/[:.]/g,'-').slice(0,19);

// Live readout: refreshes every two seconds while the section is open.
function StatusBody({session}){
 const [text,setText]=useState(()=>D.formatStatus(session.getDiagnostics()));
 useEffect(()=>{const read=()=>setText(D.formatStatus(session.getDiagnostics()));read();const timer=setInterval(read,2000);return()=>clearInterval(timer);},[session]);
 return <View style={{gap:12}}>
  <Report text={text}/>
  <Button label="Share this status as text" variant="secondary" onPress={()=>downloadText('milvayo-sync-status-'+stamp()+'.txt',text,'text/plain')}/>
 </View>;
}

function CompareBody({session}){
 const [text,setText]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const run=async()=>{setBusy(true);setError('');try{setText(D.formatCompare(await session.compare()));}catch(e){setError(e.message);}finally{setBusy(false);}};
 return <View style={{gap:12}}>
  <T muted size={12}>Reads the whole workspace from the cloud and compares it with what this device shows, record by record. Run it on both devices, then send both results.</T>
  <Button label={busy?'Comparing…':'Compare with cloud now'} disabled={busy} onPress={run}/>
  {text?<><Report text={text}/><Button label="Share this result as text" variant="secondary" onPress={()=>downloadText('milvayo-compare-'+stamp()+'.txt',text,'text/plain')}/></>:null}
  {error?<T accessibilityRole="alert">{error}</T>:null}
 </View>;
}

export default function CloudDiagnostics({session}){
 return <>
  <Fold title="Sync status" subtitle="Live signal, last send and receive, and whether the queue is blocked"><StatusBody session={session}/></Fold>
  <Fold title="Compare with cloud" subtitle="Counts and IDs per record kind, this device against the cloud"><CompareBody session={session}/></Fold>
 </>;
}
