// /src/ui/FillMotion.web.js
import {useLayoutEffect,useRef} from 'react';
import {View} from 'react-native';
export default function FillMotion({style,value}){
 const ref=useRef(null);
 useLayoutEffect(()=>{if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;const a=ref.current?.animate?.([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:380,easing:'cubic-bezier(.23,1,.32,1)'});return()=>a?.cancel();},[value]);
 return <View ref={ref} style={[style,{transformOrigin:'left center'}]}/>;
}
