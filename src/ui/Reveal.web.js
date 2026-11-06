// /src/ui/Reveal.web.js
import {useLayoutEffect,useRef} from 'react';
import {View} from 'react-native';
export default function Reveal({children,style,delay=0,duration=190,distance=8,...rest}){
 const ref=useRef(null);
 useLayoutEffect(()=>{
  if(typeof window==='undefined'||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
  const animation=ref.current?.animate?.([{opacity:0,transform:`translateY(${distance}px)`},{opacity:1,transform:'translateY(0px)'}],{duration,delay,easing:'cubic-bezier(.2,.8,.2,1)'});
  return ()=>animation?.cancel();
 },[delay,duration,distance]);
 return <View ref={ref} {...rest} style={style}>{children}</View>;
}
