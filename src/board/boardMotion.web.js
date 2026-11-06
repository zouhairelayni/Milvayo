// /src/board/boardMotion.web.js
import React,{forwardRef,useEffect,useLayoutEffect,useRef} from 'react';
import {Animated} from 'react-native';
// Individual CSS scale/rotate/translate never overwrite the live pointer transform.
export const BoardMotion=forwardRef(function BoardMotion({offset,shift=0,lifted=false,liftAmount=1,previewY=0,layoutKey,style,children,...props},ref){
 const shiftX=useRef(new Animated.Value(0)).current,shiftY=useRef(new Animated.Value(0)).current,node=useRef(null),previous=useRef(null),animation=useRef(null);
 const reduced=()=>typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 useEffect(()=>{const a=Animated.timing(shiftX,{toValue:shift,duration:reduced()?0:180,useNativeDriver:false});a.start();return()=>a.stop();},[shiftX,shift]);
 useEffect(()=>{const a=Animated.timing(shiftY,{toValue:previewY,duration:reduced()?0:180,useNativeDriver:false});a.start();return()=>a.stop();},[shiftY,previewY]);
 useEffect(()=>{const el=node.current;if(!el?.style)return;el.style.transition=reduced()?'none':'scale 180ms cubic-bezier(.23,1,.32,1), rotate 180ms cubic-bezier(.23,1,.32,1)';el.style.scale=String(lifted?1+.025*liftAmount:1);el.style.rotate=lifted?`${-1.2*liftAmount}deg`:'0deg';},[lifted,liftAmount]);
 useLayoutEffect(()=>{const el=node.current;if(!el?.getBoundingClientRect)return;const rect=el.getBoundingClientRect(),old=previous.current;previous.current=rect;
  if(!lifted&&old&&layoutKey!==undefined&&!reduced()){animation.current?.cancel();const dx=old.left-rect.left,dy=old.top-rect.top;if(Math.abs(dx)+Math.abs(dy)>1&&Math.abs(dx)<1200&&Math.abs(dy)<1000)animation.current=el.animate?.([{translate:`${dx}px ${dy}px`},{translate:'0px 0px'}],{duration:210,easing:'cubic-bezier(.23,1,.32,1)'});}
 },[layoutKey,lifted]);
 useEffect(()=>()=>animation.current?.cancel(),[]);
 return <Animated.View ref={value=>{node.current=value;if(typeof ref==='function')ref(value);else if(ref)ref.current=value;}} {...props}
  style={[style,{transform:[...offset.getTranslateTransform(),{translateX:shiftX},{translateY:shiftY}]}]}>{children}</Animated.View>;
});
