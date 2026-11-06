// /src/components/notice/IslandNotice.js
import {useEffect,useRef,useState} from 'react';
import {Pressable,ScrollView,View} from 'react-native';
import {Feather} from '@expo/vector-icons';
import NoticeMotion from './NoticeMotion';
import {T} from '../../ui/uiBase';
import {useTheme} from '../../ui/theme/theme';

export default function IslandNotice({notice,onDismiss,onAction,wide=false,topOffset=12}){
 const {c}=useTheme();
 const [display,setDisplay]=useState(notice),[stage,setStage]=useState(notice?'expanded':'hidden'),[full,setFull]=useState(false);
 const timers=useRef(new Set()),latest=useRef(null),holding=useRef(false);
 latest.current={id:notice?.id,onDismiss,onAction};
 const clear=()=>{timers.current.forEach(clearTimeout);timers.current.clear();holding.current=false;};
 const later=(fn,ms,id)=>{const timer=setTimeout(()=>{timers.current.delete(timer);if(latest.current?.id===id)fn();},ms);timers.current.add(timer);};
 const dismiss=()=>{clear();setStage('hidden');const id=display?.id;later(()=>{latest.current.onDismiss();setDisplay(null);},150,id);};
 const expand=()=>{clear();setStage('expanded');setFull(false);if(!display?.sticky)later(()=>setStage('compact'),3000,display?.id);};
 const compacted=()=>{if(holding.current||stage!=='compact'||display?.sticky)return;holding.current=true;later(dismiss,3000,display?.id);};
 useEffect(()=>{
  clear();
  if(!notice){setStage('hidden');setDisplay(null);return;}
  setDisplay(notice);setFull(false);setStage('expanded');
  if(!notice.sticky)later(()=>setStage('compact'),3000,notice.id);
  return clear;
 },[notice?.id,notice?.sticky]);
 if(!display)return null;
 const tone=display.type==='error'?c.danger:display.type==='success'?c.success:display.type==='warning'?c.warning:c.info;
 const icon=display.type==='success'?'check-circle':display.type==='error'?'alert-circle':'info';
 const title=display.title||({error:'Needs attention',success:'Saved',warning:'Review this change',info:'Workspace update'}[display.type]||'Workspace update');
 const text=String(display.text||'');
 const close=<Pressable accessibilityRole="button" accessibilityLabel="Dismiss notification" onPress={dismiss} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Feather name="x" size={16} color={c.muted}/></Pressable>;
 const compact=<View style={{height:48,flexDirection:'row',alignItems:'center',paddingLeft:14}}>
  <Pressable accessibilityRole="button" accessibilityLabel={`Read notification: ${title}`} onPress={expand} style={{flex:1,minHeight:48,flexDirection:'row',alignItems:'center',gap:8}}>
   <Feather name={icon} color={tone} size={16}/><T size={12} weight="600" numberOfLines={1} style={{flex:1}}>{title}</T>
  </Pressable>{close}
 </View>;
 const expanded=<View accessibilityLiveRegion={display.type==='error'?'assertive':'polite'} style={{padding:12,gap:8}}>
  <View style={{flexDirection:'row',alignItems:'flex-start',gap:8}}>
   <Feather name={icon} color={tone} size={20} style={{marginTop:12}}/>
   <View style={{flex:1,gap:4,paddingTop:8}}><T weight="600" size={14}>{title}</T><ScrollView style={{maxHeight:full?180:64}}><T size={13} style={{lineHeight:20}} numberOfLines={full?undefined:3}>{text}</T></ScrollView></View>{close}
  </View>
  {display.action||text.length>100?<View style={{flexDirection:'row',justifyContent:'flex-end',gap:12}}>
   {text.length>100?<Pressable accessibilityRole="button" accessibilityLabel={full?'Show less notification':'Read full notification'} onPress={()=>{clear();setFull(v=>!v);}} style={{minHeight:44,justifyContent:'center'}}><T size={13} weight="600" color={c.accentText}>{full?'Show less':'Read full message'}</T></Pressable>:null}
   {display.action?<Pressable accessibilityRole="button" accessibilityLabel="Open Backup" onPress={()=>{latest.current.onAction?.(display.action);dismiss();}} style={{minHeight:44,justifyContent:'center'}}><T size={13} weight="600" color={c.accentText}>Open Backup</T></Pressable>:null}
  </View>:null}
 </View>;
 return <View pointerEvents="box-none" style={{position:'absolute',top:topOffset,right:16,left:wide?undefined:16,alignItems:wide?'flex-end':'center',zIndex:1000}}>
  <NoticeMotion key={display.id} expanded={expanded} compact={compact} onCompact={compacted} state={stage} expandedHeight={full?300:190} style={{backgroundColor:c.elevated,borderWidth:1,borderColor:c.line}}/>
 </View>;
}
