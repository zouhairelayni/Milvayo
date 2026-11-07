// /src/canvas/CanvasCommentDot.native.js
import {Circle} from 'react-native-svg';
import Animated,{useAnimatedProps} from 'react-native-reanimated';
const {commentPosition}=require('./comments.cjs'),{batchVisible}=require('../governance/diagramVisibility.cjs');
const Dot=Animated.createAnimatedComponent(Circle);
export default function CanvasCommentDot({anchor,box,color,pose,drag,viewport,scale=1}){
 const initial=commentPosition(anchor,box,null);
 const props=useAnimatedProps(()=>{const camera=pose.get(),p=commentPosition(anchor,box,drag.get());return {cx:p.x,cy:p.y,r:7/camera.scale,strokeWidth:2/camera.scale,display:batchVisible({x:p.x-12,y:p.y-12,width:24,height:24},camera,viewport)?'inline':'none'};});
 return <Dot cx={initial.x} cy={initial.y} r={7/scale} animatedProps={props} fill={color} stroke="white"/>;
}
