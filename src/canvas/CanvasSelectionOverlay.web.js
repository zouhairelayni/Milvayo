// /src/canvas/CanvasSelectionOverlay.web.js
import {View} from 'react-native';
const {selectionAnchor}=require('./presentation.cjs');
export default function CanvasSelectionOverlay({boxes,camera,viewport,extent,bottom,children}){
 const at=selectionAnchor(boxes,camera.pose.current,camera.drag.current,viewport,extent,bottom);
 return <View nativeID="canvas-selection-overlay" style={{position:'absolute',left:0,top:0,width:at.width,transform:[{translateX:at.x},{translateY:at.y}]}}>{children}</View>;
}
