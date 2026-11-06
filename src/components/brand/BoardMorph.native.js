// /src/components/brand/BoardMorph.native.js
import {useCallback,useEffect,useId,useRef,useState} from 'react';
import {View} from 'react-native';
import Svg,{Defs,G,LinearGradient,Path,Stop} from 'react-native-svg';
import Animated,{useAnimatedProps,useFrameCallback,useReducedMotion,useSharedValue} from 'react-native-reanimated';
import {scheduleOnRN} from 'react-native-worklets';
import {useTheme} from '../../ui/theme/theme';
const data=require('./morphGeometry.cjs');
const {DURATION,ribbonPath}=require('./morphMotion.cjs');
const AnimatedPath=Animated.createAnimatedComponent(Path);

function Ribbon({index,progress,fill,continuous}){
 const props=useAnimatedProps(()=>({d:ribbonPath(index,progress.get(),continuous)}));
 return <AnimatedPath animatedProps={props} fill={fill} fillRule="evenodd"/>;
}

// Start the UI clock only after native layout; JS initialization cannot skip the
// visible opening frames. No React state or JS callback is updated per frame.
export default function BoardMorph({size=42,speed=1,duration=DURATION,continuous=false,active=false,solid=false,onStart,onFinish}){
 const {accentPref,c}=useTheme(),id=useId().replace(/[^A-Za-z0-9_-]/g,'');
 const ramps=data.palettes[accentPref]||data.palettes.Orange;
 const reduced=useReducedMotion(),[laidOut,setLaidOut]=useState(false);
 const progress=useSharedValue(active&&!reduced?0:1),startedAt=useSharedValue(-1),ticket=useSharedValue(0);
 const frames=useSharedValue(0),maxGap=useSharedValue(0),complete=useSharedValue(-1);
 const epoch=useRef(0),latest=useRef(null);
 latest.current={active,onStart,onFinish};
 const playback=(Number.isFinite(duration)&&duration>0?duration:DURATION)/(Number.isFinite(speed)&&speed>0?speed:1);
 const start=useCallback(token=>{if(epoch.current===token&&latest.current.active)latest.current.onStart?.();},[]);
 const finish=useCallback((token,count,gap,elapsed)=>{
  if(epoch.current!==token||!latest.current.active)return;
  animation.setActive(false);
  latest.current.onFinish?.({frames:count,maxGap:gap,elapsed});
 },[]);
 const tick=useCallback(info=>{
  'worklet';
  if(complete.get()===-2)return;
  // Let the final SVG props survive one native frame before JS can remove it.
  if(complete.get()>=0){const elapsed=complete.get();complete.set(-2);scheduleOnRN(finish,ticket.get(),frames.get(),maxGap.get(),elapsed);return;}
  if(startedAt.get()<0){startedAt.set(info.timestamp);scheduleOnRN(start,ticket.get());}
  frames.set(frames.get()+1);
  maxGap.set(Math.max(maxGap.get(),info.timeSincePreviousFrame||0));
  const elapsed=Math.max(0,info.timestamp-startedAt.get());
  const next=reduced?1:Math.min(1,elapsed/playback);
  progress.set(next);
  if(next>=1)complete.set(elapsed);
 },[complete,startedAt,ticket,frames,maxGap,progress,reduced,playback,start,finish]);
 const animation=useFrameCallback(tick,false);
 useEffect(()=>{
  const token=++epoch.current;
  if(!active){progress.set(1);return;}
  if(!laidOut)return;
  progress.set(reduced?1:0);startedAt.set(-1);ticket.set(token);frames.set(0);maxGap.set(0);complete.set(-1);
  animation.setActive(true);
  return()=>{epoch.current++;animation.setActive(false);};
 },[active,laidOut,playback,reduced,animation,progress,startedAt,ticket,frames,maxGap,complete]);
 return <View collapsable={false} onLayout={()=>setLaidOut(true)} style={{width:size,height:size}}>
  <Svg width={size} height={size} viewBox="0 0 256 256" accessible accessibilityLabel="Milvayo Board logo">
   {!solid?<Defs>{ramps.map(([light,dark],i)=><LinearGradient key={i} id={`${id}-gradient-${i}`} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={light}/><Stop offset="1" stopColor={dark}/></LinearGradient>)}</Defs>:null}
   <G>{[0,2,1].map(i=><Ribbon key={i} index={i} progress={progress} continuous={continuous} fill={solid?c.accent:`url(#${id}-gradient-${i})`}/>)}</G>
  </Svg>
 </View>;
}
