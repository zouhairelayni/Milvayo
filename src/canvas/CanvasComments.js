// /src/canvas/CanvasComments.js
import {memo,useMemo} from 'react';
import CanvasCommentDot from './CanvasCommentDot';
const {commentGeometry,commentPosition}=require('./comments.cjs'),{visibleBox}=require('./visibility.cjs');
const Dot=memo(CanvasCommentDot);
export default function CanvasComments({threads,objects,pose,drag,viewport,scale,viewPose,pinned}){const markers=useMemo(()=>commentGeometry(threads,objects),[threads,objects]);return <>{markers.filter(m=>!viewPose||m.box&&pinned?.has(m.box.id)||visibleBox({...commentPosition(m.anchor,m.box,null),width:24,height:24},viewPose,viewport)).map(m=><Dot key={m.anchor.id} {...m} pose={pose} drag={drag} viewport={viewport} scale={scale}/>)}</>;}
