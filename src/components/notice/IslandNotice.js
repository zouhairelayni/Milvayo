// /src/components/notice/IslandNotice.js
import {useEffect,useRef,useState} from 'react';
import {Pressable,ScrollView,View} from 'react-native';
import {Feather} from '@expo/vector-icons';
import NoticeMotion from './NoticeMotion';
import {T} from '../../ui/uiBase';
import {useTheme} from '../../ui/theme/theme';

// Accessible in-app snackbar. Errors remain until dismissed; background work never blocks navigation.
export default function IslandNotice({notice,onDismiss,onAction,wide=false}){
 const{c}=useTheme();const[display,setDisplay]=useState(notice),[stage,setStage]=useState(notice?'expanded':'hidden'),[full,setFull]=useState(false);
 const timer=useRef(null),hide=useRef(null);
 useEffect(()=>{
  clearTimeout(timer.current);clearTimeout(hide.current);
  if(!notice){setStage('hidden');return;}
  setDisplay(notice);setFull(false);setStage('expanded');
  if(!notice.sticky&&notice.type!=='error'&&notice.type!=='warning')timer.current=setTimeout(()=>{setStage('hidden');hide.current=setTimeout(()=>{onDismiss();setDisplay(null);},150);},4600);
  return()=>{clearTimeout(timer.current);clearTimeout(hide.current);};
 },[notice?.id]);
 const dismiss=()=>{clearTimeout(timer.current);setStage('hidden');hide.current=setTimeout(()=>{onDismiss();setDisplay(null);},150);};
 if(!display)return null;
 const tone=display.type==='error'?c.danger:display.type==='success'?c.success:display.type==='warning'?c.warning:c.info;
 const title=display.title||({error:'Needs attention',success:'Saved',warning:'Review this change',info:'Workspace update'}[display.type]||'Workspace update');
 const expanded=<View accessibilityLiveRegion={display.type==='error'?'assertive':'polite'} style={{padding:16,gap:8}}>
  <View style={{flexDirection:'row',alignItems:'flex-start',gap:12}}>
   <Feather name={display.type==='success'?'check-circle':display.type==='error'?'alert-circle':'info'} color={tone} size={20}/>
   <View style={{flex:1,gap:4}}><T weight="600" size={14}>{title}</T><ScrollView style={{maxHeight:full?180:64}}><T size={13} style={{lineHeight:20}} numberOfLines={full?undefined:3}>{display.text}</T></ScrollView></View>
   <Pressable accessibilityRole="button" accessibilityLabel="Dismiss notification" onPress={dismiss} hitSlop={6} style={{width:36,height:36,alignItems:'center',justifyContent:'center'}}><Feather name="x" size={18} color={c.muted}/></Pressable>
  </View>
  {display.action||display.text.length>100?<View style={{flexDirection:'row',justifyContent:'flex-end',gap:12}}>
   {display.text.length>100?<Pressable accessibilityRole="button" accessibilityLabel={full?'Show less notification':'Read full notification'} onPress={()=>setFull(v=>!v)} style={{minHeight:40,justifyContent:'center'}}><T size={13} weight="600" color={c.accentText}>{full?'Show less':'Read full message'}</T></Pressable>:null}
   {display.action?<Pressable accessibilityRole="button" accessibilityLabel="Open Backup" onPress={()=>{onAction?.(display.action);dismiss();}} style={{minHeight:40,justifyContent:'center'}}><T size={13} weight="600" color={c.accentText}>Open Backup</T></Pressable>:null}
  </View>:null}
 </View>;
 return <View pointerEvents="box-none" style={{position:'absolute',bottom:wide?24:100,right:16,left:wide?undefined:16,alignItems:wide?'flex-end':'center',zIndex:1000}}>
  <NoticeMotion key={display.id} expanded={expanded} state={stage} expandedHeight={full?280:180} style={{borderRadius:16,backgroundColor:c.elevated,borderWidth:1,borderColor:c.line}}/>
 </View>;
}
