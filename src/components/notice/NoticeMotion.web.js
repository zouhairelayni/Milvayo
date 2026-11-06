// /src/components/notice/NoticeMotion.web.js
import {useEffect,useRef} from 'react';
import {View,useWindowDimensions} from 'react-native';
export default function NoticeMotion({expanded,state='expanded',expandedHeight=104,style}){
 const{width}=useWindowDimensions();const ref=useRef(null);
 useEffect(()=>{
  if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
  const hidden=state==='hidden';const a=ref.current?.animate?.(hidden?[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(8px)'}]:[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:hidden?150:190,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'});
  return()=>a?.cancel();
 },[state]);
 return <View ref={ref} pointerEvents={state==='hidden'?'none':'auto'} style={[{width:Math.min(width-32,420),minHeight:72,maxHeight:expandedHeight,overflow:'hidden'},style]}>{expanded}</View>;
}
