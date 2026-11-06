// /src/components/notice/NoticeMotion.web.js
import {useLayoutEffect,useRef} from 'react';
import {View,useWindowDimensions} from 'react-native';
export default function NoticeMotion({expanded,compact,onCompact,state='expanded',expandedHeight=190,style}){
 const {width}=useWindowDimensions(),maxW=Math.max(1,Math.min(width-32,420)),smallW=Math.min(maxW,248);
 const bg=useRef(null),large=useRef(null),small=useRef(null),latest=useRef(null),pose=useRef({width:maxW,height:expandedHeight,opacity:0,expanded:1});
 latest.current={state,onCompact};
 useLayoutEffect(()=>{
  const opened=state==='expanded',visible=state!=='hidden',target={width:opened?maxW:smallW,height:opened?(large.current?.getBoundingClientRect?.().height||expandedHeight):48,opacity:visible?1:0,expanded:opened?1:0};
  const from=pose.current;pose.current=target;
  const frame=p=>({width:`${p.width}px`,height:`${p.height}px`,borderRadius:`${p.expanded?20:24}px`,opacity:p.opacity,transform:`translate(${(maxW-p.width)/2}px,${p.opacity?0:-8}px)`});
  const start=frame(from),end=frame(target),animations=[];
  const reduced=typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const animate=(node,a,b)=>{
   if(!node)return null;Object.assign(node.style,b);
   if(reduced||!node.animate)return null;
   const animation=node.animate([a,b],{duration:state==='hidden'?150:220,easing:'cubic-bezier(.22,1,.36,1)'});animations.push(animation);return animation;
  };
  const background=animate(bg.current,start,end);
  animate(large.current,{opacity:from.opacity*from.expanded},{opacity:target.opacity*target.expanded});
  animate(small.current,{opacity:from.opacity*(1-from.expanded)},{opacity:target.opacity*(1-target.expanded)});
  let alive=true;
  const done=()=>{if(alive&&latest.current.state==='compact')latest.current.onCompact?.();};
  if(state==='compact'){if(background?.finished)background.finished.then(done,()=>{});else done();}
  return()=>{alive=false;animations.forEach(animation=>animation.cancel());};
 },[state,maxW,smallW,expandedHeight]);
 return <View pointerEvents="box-none" style={{width:maxW,height:state==='expanded'?expandedHeight:48}}>
  <View ref={bg} pointerEvents="none" style={[{position:'absolute',top:0,left:0,width:maxW,height:expandedHeight,borderRadius:20},style]}/>
  <View ref={large} pointerEvents={state==='expanded'?'auto':'none'} accessibilityElementsHidden={state!=='expanded'} importantForAccessibility={state==='expanded'?'auto':'no-hide-descendants'} style={{position:'absolute',top:0,left:0,width:maxW,maxHeight:expandedHeight}}>{expanded}</View>
  <View ref={small} pointerEvents={state==='compact'?'auto':'none'} accessibilityElementsHidden={state!=='compact'} importantForAccessibility={state==='compact'?'auto':'no-hide-descendants'} style={{position:'absolute',top:0,left:(maxW-smallW)/2,width:smallW,opacity:0}}>{compact}</View>
 </View>;
}
