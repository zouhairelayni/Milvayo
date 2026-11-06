// /src/app/navigation/BackSurface.native.js
import {useMemo} from 'react';
import {Platform,View} from 'react-native';
import {GestureDetector,GestureHandlerRootView,usePanGesture} from 'react-native-gesture-handler';
import {scheduleOnRN} from 'react-native-worklets';
const {backEvents}=require('./backEvents.cjs');
const back=()=>backEvents.dispatch();
export default function BackSurface({children,style}){
 const config=useMemo(()=>({
  enabled:Platform.OS==='ios',hitSlop:{left:0,width:24},activeOffsetX:14,failOffsetY:[-14,14],maxPointers:1,
  onDeactivate:e=>{ 'worklet'; if(!e.canceled&&e.translationX>Math.abs(e.translationY)*1.4&&(e.translationX>=72||e.translationX>=20&&e.velocityX>=650))scheduleOnRN(back); },
 }),[]);
 const gesture=usePanGesture(config);
 if(Platform.OS!=='ios')return <View style={style||{flex:1}}>{children}</View>;
 return <GestureHandlerRootView style={style||{flex:1}}><GestureDetector gesture={gesture}><View collapsable={false} style={{flex:1}}>{children}</View></GestureDetector></GestureHandlerRootView>;
}
