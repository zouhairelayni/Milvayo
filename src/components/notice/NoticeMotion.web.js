// /src/components/notice/NoticeMotion.web.js
import {useEffect, useRef} from 'react';
import {Animated, useWindowDimensions} from 'react-native';

// Same three states as native, animated in React Native Web. No system APIs.
export default function NoticeMotion({compact, expanded, state='expanded', expandedHeight=96, style}) {
  const {width} = useWindowDimensions();
  const fullWidth = Math.max(200, Math.min(width - 40, 388));
  const phase = useRef(new Animated.Value(0)).current;
  const target = state === 'expanded' ? 1 : state === 'compact' ? .52 : 0;
  useEffect(() => {
    const animation = target===1
      ? Animated.spring(phase,{toValue:target,friction:10,tension:80,useNativeDriver:false})
      : Animated.timing(phase,{toValue:target,duration:210,useNativeDriver:false});
    animation.start();
    return () => animation.stop();
  },[phase,target]);
  const range=[0,.52,1];
  return <Animated.View pointerEvents="box-none" style={[style,{
    width:phase.interpolate({inputRange:range,outputRange:[44,164,fullWidth]}),
    height:phase.interpolate({inputRange:range,outputRange:[30,40,expandedHeight]}),
    opacity:phase.interpolate({inputRange:[0,.2,1],outputRange:[0,1,1]}),
    transform:[
      {translateY:phase.interpolate({inputRange:range,outputRange:[-12,0,0]})},
      {scale:phase.interpolate({inputRange:[0,.52,1,1.08],outputRange:[.96,1,1,1.012],extrapolate:'clamp'})},
    ],
    alignItems:'center',
  }]}>
    <Animated.View pointerEvents={state==='compact'?'auto':'none'} style={{position:'absolute',top:0,bottom:0,left:0,right:0,justifyContent:'center',alignItems:'center',opacity:phase.interpolate({inputRange:[0,.32,.52,.8,1],outputRange:[0,.55,1,.12,0]})}}>{compact}</Animated.View>
    <Animated.View pointerEvents={state==='expanded'?'auto':'none'} style={{position:'absolute',top:0,bottom:0,left:0,right:0,opacity:phase.interpolate({inputRange:[0,.52,.75,1],outputRange:[0,0,.18,1]})}}>{expanded}</Animated.View>
  </Animated.View>;
}
