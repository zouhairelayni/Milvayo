// /src/ui/ScreenPresence.web.js
import {useLayoutEffect,useRef} from 'react';
import {View} from 'react-native';
export default function ScreenPresence({active,children,style}){
 const ref=useRef(null);
 useLayoutEffect(()=>{if(!active||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;const a=ref.current?.animate?.([{opacity:0},{opacity:1}],{duration:120,easing:'ease-out'});return()=>a?.cancel();},[active]);
 return <View ref={ref} style={[style,{display:active?'flex':'none'}]}>{children}</View>;
}
