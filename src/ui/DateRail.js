// /src/ui/DateRail.js
import {useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {Platform,ScrollView,View,useWindowDimensions} from 'react-native';
import {T} from './uiBase';
import PressSurface from './PressSurface';
import {useTheme} from './theme/theme';
const{scheduleSeries}=require('../domain/dashboard.cjs');

export default function DateRail({days,tasks=[],value,onChange,onShift}){
 const{c}=useTheme(),window=useWindowDimensions(),[width,setWidth]=useState(Math.max(1,window.width-32));
 const scroll=useRef(null),offset=useRef(width),pending=useRef(false),timer=useRef(null);
 const anchor=days[0]?.date,canShift=!!onShift;
 const pages=useMemo(()=>{
  if(!anchor||!canShift)return[days];
  const day=Date.parse(anchor+'T12:00:00Z');
  return[-1,0,1].map(n=>n===0?days:scheduleSeries(tasks,new Date(day+n*7*86400000).toISOString().slice(0,10)));
 },[anchor,days,tasks,canShift]);
 const center=pages.length===3?width:0;
 useLayoutEffect(()=>{
  clearTimeout(timer.current);pending.current=false;offset.current=center;
  scroll.current?.scrollTo({x:center,animated:false});
 },[anchor,width,center]);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 const settle=()=>{
  clearTimeout(timer.current);if(pending.current||!onShift||pages.length!==3)return;
  const direction=Math.sign(Math.round(offset.current/width)-1);if(!direction)return;
  pending.current=true;
  if(onShift(direction)===false){pending.current=false;offset.current=center;scroll.current?.scrollTo({x:center,animated:true});}
 };
 const onScroll=e=>{
  const x=e.nativeEvent.contentOffset.x;if(!Number.isFinite(x))return;offset.current=x;
  // Web has no native momentum-end callback; settle only after scrolling stops.
  if(Platform.OS==='web'){clearTimeout(timer.current);timer.current=setTimeout(settle,180);}
 };
 return <ScrollView ref={scroll} horizontal pagingEnabled directionalLockEnabled showsHorizontalScrollIndicator={false}
  contentOffset={{x:center,y:0}} scrollEventThrottle={16} onScroll={onScroll} onMomentumScrollEnd={e=>{const x=e.nativeEvent.contentOffset.x;if(Number.isFinite(x)){offset.current=x;settle();}}}
  onLayout={e=>{const next=e.nativeEvent.layout.width;if(Number.isFinite(next)&&next>0)setWidth(next);}}
  accessibilityLabel="Swipe dates to change week" accessibilityActions={onShift?[{name:'decrement',label:'Previous week'},{name:'increment',label:'Next week'}]:[]}
  onAccessibilityAction={e=>{const action=e.nativeEvent.actionName;if(action==='increment'||action==='decrement'){offset.current=action==='increment'?width*2:0;settle();}}} style={{flexGrow:0}}>
  {pages.map(page=><View key={page[0]?.date||'empty'} style={{width,flexDirection:'row',gap:6}}>{page.map(d=>{
   const active=value===d.date;return <PressSurface key={d.date} accessibilityRole="button" accessibilityLabel={`Focus ${d.date}, ${d.value} tasks due`} accessibilityState={{selected:active}} onPress={()=>onChange(active?null:d.date)} containerStyle={{flex:1}}
    style={{minHeight:76,borderRadius:18,backgroundColor:active?c.ink:c.surface,alignItems:'center',justifyContent:'center',gap:6,borderWidth:1,borderColor:active?c.ink:c.line}}>
    <T size={10} color={active?c.bg:c.muted}>{d.label.slice(0,2)}</T><T size={18} weight="500" color={active?c.bg:c.ink}>{Number(d.date.slice(-2))}</T><View style={{width:4,height:4,borderRadius:2,backgroundColor:d.value?(active?c.bg:c.accent):'transparent'}}/>
   </PressSurface>;
  })}</View>)}
 </ScrollView>;
}
