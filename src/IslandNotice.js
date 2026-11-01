import {useCallback, useEffect, useRef, useState} from 'react';
import {Pressable, View} from 'react-native';
import {Feather} from '@expo/vector-icons';
import NoticeMotion from './NoticeMotion';
import {T} from './ui';

const COLORS={success:'#64D9A1',error:'#FF9A84',info:'#8FB5FE',warning:'#F4C96F'};
const compactLabels={success:'Saved',error:'Attention',info:'Update',warning:'Warning'};
// In-app Dynamic Island-style notice; no access to iOS system Dynamic Island.
// The shell anchors this overlay near the screen top *after* the OS safe-area inset.
export default function IslandNotice({notice,onDismiss,wide=false,topOffset=12}) {
  const [display,setDisplay]=useState(null);
  const [stage,setStage]=useState('hidden');
  const [manual,setManual]=useState(false);
  const timers=useRef([]);
  const clearTimers=useCallback(()=>{timers.current.forEach(clearTimeout);timers.current=[];},[]);
  const later=useCallback((fn,ms)=>{timers.current.push(setTimeout(fn,ms));},[]);
  const currentId=notice?.id;
  const hasExpanded=useRef(false);
  useEffect(()=>{
    clearTimers();
    hasExpanded.current=false;
    if (!notice) {
      setStage('hidden');
      return;
    }
    setDisplay(notice);
    setManual(false);
    setStage('compact');
    // A brief recognizable compact state before the full message appears.
    later(()=>setStage('expanded'),240);
    return clearTimers;
  },[currentId,clearTimers,later]);
  const dismiss=useCallback(()=>{
    clearTimers();
    setStage('hidden');
    later(()=>{onDismiss();setDisplay(null);},240);
  },[onDismiss,clearTimers,later]);
  useEffect(()=>{
    if(!display || stage==='hidden' || manual) return undefined;
    if(display.type==='error') return undefined; // Errors require explicit dismissal.
    if(stage==='expanded') {
      const t=setTimeout(()=>setStage('compact'),display.type==='warning'?4300:3100);
      return ()=>clearTimeout(t);
    }
    if(stage==='compact') {
      // An initial compact state is controlled by the entry timer above.
      // Only auto-dismiss a pill that has already been expanded.
      return undefined;
    }
    return undefined;
  },[stage,display?.id,manual]);
  // Keep the compact confirmation visible long enough to recognize it, then dismiss.
  useEffect(()=>{if(stage==='expanded')hasExpanded.current=true;if(stage==='hidden')hasExpanded.current=false;},[stage]);
  useEffect(()=>{
    if(stage!=='compact' || !hasExpanded.current || manual) return undefined;
    const t=setTimeout(dismiss,1250);
    return ()=>clearTimeout(t);
  },[stage,display?.id,manual,dismiss]);
  if (!display) return null;
  const expandedHeight=display.text.length>115?134:display.text.length>65?116:96;
  const type=COLORS[display.type]?display.type:'info';
  const color=COLORS[type];
  const icon=type==='success'?'check-circle':type==='error'?'alert-circle':type==='warning'?'alert-triangle':'info';
  const compact=<Pressable accessibilityRole="button" accessibilityLabel={`${compactLabels[type]}, expand notification`} onPress={()=>{clearTimers();setManual(true);setStage('expanded');}} style={{flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:12,height:'100%'}}>
    <Feather name={icon} size={15} color={color}/>
    <T size={12} weight="700" color="#F7F7F7" numberOfLines={1}>{compactLabels[type]}</T>
  </Pressable>;
  const expanded=<View accessibilityLiveRegion="polite" style={{flex:1,justifyContent:'center',paddingHorizontal:18,paddingVertical:12}}>
    <View style={{flexDirection:'row',alignItems:'center',gap:12,minWidth:0}}>
      <View style={{width:33,height:33,borderRadius:17,backgroundColor:color+'22',alignItems:'center',justifyContent:'center'}}><Feather name={icon} size={18} color={color}/></View>
      <View style={{flex:1,minWidth:0,gap:3}}>
        <T size={13} weight="700" color="#FFFFFF" numberOfLines={1}>{compactLabels[type]}</T>
        <T size={12} color="#D4D4D4" numberOfLines={3} style={{lineHeight:17}}>{display.text}</T>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss notification" onPress={dismiss} hitSlop={12} style={{width:34,height:34,alignItems:'center',justifyContent:'center',borderRadius:17}}><Feather name="x" size={17} color="#CFCFCF"/></Pressable>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel="Collapse notification" onPress={()=>{setManual(true);setStage('compact');}} style={{alignSelf:'center',paddingTop:6,paddingHorizontal:16}}><View style={{width:30,height:3,borderRadius:2,backgroundColor:'#666666'}} /></Pressable>
  </View>;
  return <NoticeMotion key={display.id} state={stage} compact={compact} expanded={expanded} expandedHeight={expandedHeight} style={{position:'absolute',top:topOffset,alignSelf:'center',zIndex:1000,borderRadius:38,backgroundColor:'#090909',borderWidth:1,borderColor:'#383838',shadowColor:'#000',shadowOpacity:.30,shadowRadius:18,shadowOffset:{width:0,height:9},elevation:14,overflow:'hidden'}}/>;
}
