// /src/components/charts/Column.web.js
import {memo,useLayoutEffect,useRef} from 'react';
import {Rect} from 'react-native-svg';
export default memo(function Column({height=0,baseline,delay=0,...props}){
 const ref=useRef(null);
 useLayoutEffect(()=>{if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;const el=ref.current?.elementRef?.current||ref.current;
  const a=el?.animate?.([{transform:'scaleY(.01)'},{transform:'scaleY(1)'}],{duration:420,delay,easing:'cubic-bezier(.23,1,.32,1)'});return()=>a?.cancel();},[height,delay]);
 return <Rect ref={ref} {...props} height={height} y={baseline-height} style={{transformBox:'fill-box',transformOrigin:'center bottom'}}/>;
});
