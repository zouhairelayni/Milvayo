// /src/components/shell/NavIcon.native.js
import {useEffect} from 'react';
import {View} from 'react-native';
import {Feather} from '@expo/vector-icons';
import Animated,{Easing,ReduceMotion,useAnimatedStyle,useSharedValue,withTiming} from 'react-native-reanimated';
export default function NavIcon({name,color,selected}){
 const scale=useSharedValue(selected?1.2:1);
 useEffect(()=>{scale.set(withTiming(selected?1.2:1,{duration:150,easing:Easing.bezier(.23,1,.32,1),reduceMotion:ReduceMotion.System}));},[selected,scale]);
 const motion=useAnimatedStyle(()=>({transform:[{scale:scale.get()}]}));
 return <View pointerEvents="none" style={{width:48,height:28,alignItems:'center',justifyContent:'center'}}>
  <Animated.View style={motion}><Feather name={name} size={20} color={color}/></Animated.View>
 </View>;
}
