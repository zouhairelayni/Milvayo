// /src/screens/canvas/CanvasSources.js
import {useMemo,useState} from 'react';
import {FlatList,View,useWindowDimensions} from 'react-native';
import {Input,Segmented,T} from '../../ui/ui';
import CanvasMenuRow from './CanvasMenuRow';
const {sourceKey}=require('../../canvas/editorTools.cjs');
const groups=[{value:'all',label:'All'},{value:'task',label:'Tasks'},{value:'artifact',label:'Artifacts'},{value:'roadmap',label:'Roadmaps'}];
const icons={task:'check-square',wbs:'git-branch',risk:'alert-triangle',document:'file-text',stakeholder:'users',sprint:'repeat',project:'folder',roadmap:'calendar'};
export default function CanvasSources({options,query,onQuery,snapshot,onSnapshot,onInsert,error}){
 const [filter,setFilter]=useState('all'),{height}=useWindowDimensions();
 const rows=useMemo(()=>options.filter(o=>filter==='all'||(filter==='artifact'?!['task','roadmap'].includes(o.sourceType):o.sourceType===filter)).sort((a,b)=>a.sourceType.localeCompare(b.sourceType)),[options,filter]);
 return <View style={{height:Math.max(160,Math.min(520,height*.6)),gap:12}}>
  <Input value={query} onChangeText={onQuery} placeholder="Find tasks, artifacts or roadmaps" accessibilityLabel="Find a project source"/>
  <Segmented options={[{value:'live',label:'Live link'},{value:'snapshot',label:'Snapshot'}]} value={snapshot?'snapshot':'live'} onChange={value=>onSnapshot(value==='snapshot')}/>
  <Segmented options={groups} value={filter} onChange={setFilter}/>
  {error?<T accessibilityRole="alert">{error}</T>:null}
  <FlatList data={rows} keyExtractor={sourceKey} initialNumToRender={8} maxToRenderPerBatch={8} windowSize={5} keyboardShouldPersistTaps="handled" style={{flex:1,minHeight:48}}
   ListEmptyComponent={<T muted>No matching project sources</T>}
   renderItem={({item})=><CanvasMenuRow icon={icons[item.sourceType]} label={item.title} detail={item.sourceType==='wbs'?'Work structure':item.sourceType} onPress={()=>onInsert(item)}/>}/>
 </View>;
}
