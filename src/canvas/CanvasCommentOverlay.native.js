// /src/canvas/CanvasCommentOverlay.native.js
import Animated,{useAnimatedStyle,useSharedValue} from 'react-native-reanimated';
const {commentBubbleAnchor}=require('./comments.cjs');
export default function CanvasCommentOverlay({anchor,box,camera,viewport,children}){
 const height=useSharedValue(240),style=useAnimatedStyle(()=>{const at=commentBubbleAnchor(anchor,box,camera.pose.get(),camera.drag.get(),viewport,height.get());return {transform:[{translateX:at.x},{translateY:at.y}]};});
 return <Animated.View onLayout={e=>height.set(e.nativeEvent.layout.height)} style={[{position:'absolute',left:0,top:0,width:Math.min(300,viewport.width-24)},style]}>{children}</Animated.View>;
}
