// /src/canvas/CanvasSelectionOverlay.native.js
import Animated,{useAnimatedStyle} from 'react-native-reanimated';
const {selectionAnchor}=require('./presentation.cjs');
export default function CanvasSelectionOverlay({boxes,camera,viewport,extent,bottom,children}){
 const style=useAnimatedStyle(()=>{const at=selectionAnchor(boxes,camera.pose.get(),camera.drag.get(),viewport,extent,bottom);return {transform:[{translateX:at.x},{translateY:at.y}]};});
 return <Animated.View style={[{position:'absolute',left:0,top:0,width:Math.min(extent,viewport.width-24)},style]}>{children}</Animated.View>;
}
