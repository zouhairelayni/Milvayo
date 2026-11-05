// /src/components/inline/DisclosureGlyph.native.js
import {useEffect} from 'react';
import Animated,{Easing,ReduceMotion,useAnimatedStyle,useSharedValue,withTiming} from 'react-native-reanimated';
import {Feather} from '@expo/vector-icons';
export default function DisclosureGlyph({expanded,color}){
 const angle=useSharedValue(expanded?45:0);
 useEffect(()=>{angle.value=withTiming(expanded?45:0,{duration:185,easing:Easing.bezier(0.22,1,0.36,1),reduceMotion:ReduceMotion.System})},[expanded]);
 const style=useAnimatedStyle(()=>({transform:[{rotate:`${angle.value}deg`}]}));
 return <Animated.View style={style}><Feather name="plus" color={color} size={21}/></Animated.View>;
}
