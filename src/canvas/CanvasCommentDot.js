// /src/canvas/CanvasCommentDot.js
import {Circle} from 'react-native-svg';
const {commentPosition}=require('./comments.cjs');
export default function CanvasCommentDot({anchor,box,color,scale=1}){const p=commentPosition(anchor,box,null);return <Circle id={`canvas-comment-${anchor.id}`} cx={p.x} cy={p.y} r={7/scale} fill={color} stroke="white" strokeWidth={2/scale}/>;}
