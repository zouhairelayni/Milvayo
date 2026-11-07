// /src/canvas/CanvasCommentOverlay.js
import {useRef} from 'react';
import {View} from 'react-native';
const {commentBubbleAnchor}=require('./comments.cjs');
export default function CanvasCommentOverlay({anchor,box,camera,viewport,children}){
 const host=useRef(null),at=commentBubbleAnchor(anchor,box,camera.pose.current,camera.drag.current,viewport);
 return <View nativeID="canvas-comment-bubble" ref={host} onLayout={e=>host.current?.setAttribute?.('data-bubble-height',String(e.nativeEvent.layout.height))} style={{position:'absolute',left:0,top:0,width:at.width,transform:[{translateX:at.x},{translateY:at.y}]}}>{children}</View>;
}
