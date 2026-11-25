// /src/screens/workspace/CloudConflicts.js
import {useState} from 'react';
import {View} from 'react-native';
import {Button,Card,T} from '../../ui/ui';
const {equal}=require('../../cloud/schema.cjs');
export default function CloudConflicts({session}){
 const [review,setReview]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const run=async fn=>{setBusy(true);setError('');try{await fn();}catch(e){setError(e.message);}finally{setBusy(false);}};
 return <View style={{gap:12}}>
  <T muted size={13}>Compare your queued changes with the current authorized cloud version. The original edit stays in sync recovery after resolution.</T>
  <Button label="Review conflicts" variant="secondary" disabled={busy} onPress={()=>run(async()=>setReview(await session.loadConflicts()))}/>
  {review?.conflicts.length===0?<T muted>No queued conflicts</T>:null}
  {review?.conflicts.map(q=><Card key={q.id} pad={12} style={{gap:12}}>
   <T size={13}>Local actor: {q.actor}</T><T muted size={12}>{q.error}</T>
   {q.changes.map((change,index)=>{const remote=q.remote[index];return <View key={change.key} style={{gap:8}}>
    <T size={13}>{change.after?.data?.title||change.before?.data?.title||change.key}</T>
    <T muted size={12}>Cloud revision {remote?.revision||'unavailable'} · sequence {remote?.sequence||'unavailable'}</T>
    {q.gone?.[index]?<T muted>Someone deleted this record. {q.changes[index]?.before?.kind==='tasks'?'"Bring the task back" restores it with your edit (without its old parent, dependencies, list, sprint, phase or release). ':''}"Keep cloud version" drops your edit and clears this conflict; a copy of your edit stays in the recovery export.</T>:!remote||remote.deleted?<T muted>This record is not available in the cloud right now. Your original edit is kept in recovery.</T>:null}
    {[...new Set([...Object.keys(change.before?.data||{}),...Object.keys(change.after?.data||{})])].filter(field=>!equal(change.before?.data?.[field],change.after?.data?.[field])).map(field=><View key={field} style={{gap:4}}>
     <T size={12}>{field}</T><T selectable size={12}>Your edit: {JSON.stringify(change.after?.data?.[field]??null)}</T><T selectable muted size={12}>Cloud: {JSON.stringify(remote?.data?.[field]??null)}</T>
    </View>)}
   </View>;})}
   {(()=>{const dropsEdit=q.changes.some((change,index)=>q.gone?.[index]&&change.after);return <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
    {q.changes.length&&q.changes.every((change,index)=>q.gone?.[index]&&change.after&&change.before?.kind==='tasks')?<Button label="Bring the task back" disabled={busy} onPress={()=>run(async()=>{await session.resolveConflict(q.id,'restore',review.remote);setReview(await session.loadConflicts());})}/>:null}
    {dropsEdit?null:<Button label="Keep my changed fields" disabled={busy} onPress={()=>run(async()=>{await session.resolveConflict(q.id,'local',review.remote);setReview(await session.loadConflicts());})}/>}
    <Button label={dropsEdit?'Keep cloud version (drop my edit)':'Keep cloud version'} variant="secondary" disabled={busy} onPress={()=>run(async()=>{await session.resolveConflict(q.id,'remote',review.remote);setReview(await session.loadConflicts());})}/>
   </View>;})()}
  </Card>)}
  {error?<T size={13}>{error}</T>:null}
 </View>;
}
