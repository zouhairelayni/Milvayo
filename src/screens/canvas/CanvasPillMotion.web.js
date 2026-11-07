// /src/screens/canvas/CanvasPillMotion.web.js
import {useEffect,useRef} from 'react';
import {View} from 'react-native';
export default function CanvasPillMotion({open,active,width,colors}){
 const ref=useRef(null),previous=useRef({width:open?width:56,opacity:active?.94:.18});
 useEffect(()=>{const node=ref.current,target={width:open?width:56,opacity:active?.94:.18},media=window.matchMedia?.('(prefers-reduced-motion: reduce)');let animation;
  if(!media?.matches)animation=node?.animate?.([{width:previous.current.width+'px',opacity:previous.current.opacity},{width:target.width+'px',opacity:target.opacity}],{duration:open?220:160,easing:'cubic-bezier(.22,1,.36,1)'});
  previous.current=target;const changed=()=>animation?.cancel();media?.addEventListener?.('change',changed);return()=>{if(animation&&node){const current=window.getComputedStyle?.(node);if(current)previous.current={width:parseFloat(current.width)||target.width,opacity:parseFloat(current.opacity)};}animation?.cancel();media?.removeEventListener?.('change',changed);};
 },[open,active,width]);
 return <View ref={ref} pointerEvents="none" style={{position:'absolute',left:0,top:0,width:open?width:56,height:56,opacity:active?.94:.18,borderRadius:28,backgroundColor:colors.elevated,borderWidth:1,borderColor:colors.line}}/>;
}
