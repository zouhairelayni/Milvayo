import {useEffect} from 'react';
import Animated,{useAnimatedStyle,useSharedValue,withTiming} from 'react-native-reanimated';
import {Feather} from '@expo/vector-icons';
export default function DisclosureGlyph({expanded,color}){
 const angle=useSharedValue(expanded?45:0);
 useEffect(()=>{angle.value=withTiming(expanded?45:0,{duration:185})},[expanded]);
 const style=useAnimatedStyle(()=>({transform:[{rotate:`${angle.value}deg`}]}));
 return <Animated.View style={style}><Feather name="plus" color={color} size={21}/></Animated.View>;
}
