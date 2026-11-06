// /src/components/charts/TracePath.web.js
import {useLayoutEffect,useRef} from 'react';
import {Path} from 'react-native-svg';
export default function TracePath({d,length=1000,...props}){
 const ref=useRef(null);
 useLayoutEffect(()=>{if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;const node=ref.current?.elementRef?.current||ref.current;const animation=node?.animate?.([{strokeDasharray:`${length} ${length}`,strokeDashoffset:String(length)},{strokeDasharray:`${length} ${length}`,strokeDashoffset:'0'}],{duration:440,easing:'cubic-bezier(.16,1,.3,1)'});return()=>animation?.cancel();},[d,length]);
 return <Path ref={ref} {...props} d={d}/>;
}
