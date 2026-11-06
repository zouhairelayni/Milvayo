// /src/ui/PressSurface.native.js
import {Pressable} from 'react-native';
import Animated,{ReduceMotion,useAnimatedStyle,useSharedValue,withTiming} from 'react-native-reanimated';
export default function PressSurface({children,style,containerStyle,disabled,...props}){
 const down=useSharedValue(0);
 const motion=useAnimatedStyle(()=>({transform:[{scale:1-down.get()*.035}],opacity:1-down.get()*.14}));
 const set=value=>down.set(withTiming(value,{duration:value?70:170,reduceMotion:ReduceMotion.System}));
 return <Pressable {...props} disabled={disabled} onPressIn={()=>set(1)} onPressOut={()=>set(0)} style={containerStyle}>
  <Animated.View style={[style,motion,disabled?{opacity:.38}:null]}>{children}</Animated.View>
 </Pressable>;
}
