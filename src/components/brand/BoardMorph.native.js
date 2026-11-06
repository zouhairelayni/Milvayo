// /src/components/brand/BoardMorph.native.js
import {useCallback,useEffect,useId,useRef} from 'react';
import Svg,{Defs,G,LinearGradient,Path,Stop} from 'react-native-svg';
import Animated,{cancelAnimation,Easing,ReduceMotion,useAnimatedProps,useSharedValue,withTiming} from 'react-native-reanimated';
import {scheduleOnRN} from 'react-native-worklets';
import {useTheme} from '../../ui/theme/theme';
const data=require('./morphGeometry.cjs');
const {DURATION,ribbonPath}=require('./morphMotion.cjs');
const AnimatedPath=Animated.createAnimatedComponent(Path);

function Ribbon({index,progress,fill}){
 const props=useAnimatedProps(()=>({d:ribbonPath(index,progress.get())}));
 return <AnimatedPath animatedProps={props} fill={fill} fillRule="evenodd"/>;
}

// Keep the cold-start morph on the UI thread while workspace normalization uses JS.
export default function BoardMorph({size=42,speed=1,active=false,solid=false,onFinish}){
 const {accentPref,c}=useTheme(),id=useId().replace(/[^A-Za-z0-9_-]/g,'');
 const ramps=data.palettes[accentPref]||data.palettes.Orange;
 const progress=useSharedValue(active?0:1),epoch=useRef(0),latest=useRef(null);
 latest.current={active,onFinish};
 const finish=useCallback(ticket=>{if(epoch.current===ticket&&latest.current.active)latest.current.onFinish?.();},[]);
 useEffect(()=>{
  const ticket=++epoch.current;
  if(!active){progress.set(1);return;}
  progress.set(0);
  progress.set(withTiming(1,{duration:DURATION/(Number.isFinite(speed)&&speed>0?speed:1),easing:Easing.linear,reduceMotion:ReduceMotion.System},finished=>{if(finished)scheduleOnRN(finish,ticket);}));
  return()=>{epoch.current++;cancelAnimation(progress);};
 },[active,speed,progress,finish]);
 return <Svg width={size} height={size} viewBox="0 0 256 256" accessible accessibilityLabel="Milvayo Board logo">
  {!solid?<Defs>{ramps.map(([light,dark],i)=><LinearGradient key={i} id={`${id}-gradient-${i}`} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={light}/><Stop offset="1" stopColor={dark}/></LinearGradient>)}</Defs>:null}
  <G>{[0,2,1].map(i=><Ribbon key={i} index={i} progress={progress} fill={solid?c.accent:`url(#${id}-gradient-${i})`}/>)}</G>
 </Svg>;
}
