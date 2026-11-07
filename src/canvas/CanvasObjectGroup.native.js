// /src/canvas/CanvasObjectGroup.native.js
import {useMemo} from 'react';
import { G, Path, Text as SvgText } from 'react-native-svg';
import Animated, { useAnimatedProps, useDerivedValue } from 'react-native-reanimated';
const { batchVisible } = require('../governance/diagramVisibility.cjs');
const {routingObjects}=require('./connectionGeometry.cjs');
const {pathLabel,pathBounds,routeAffected}=require('./routing.cjs');
const { connectorPath, previewBox } = require('./interaction.cjs');
const Group=Animated.createAnimatedComponent(G),Edge=Animated.createAnimatedComponent(Path),Label=Animated.createAnimatedComponent(SvgText);
export default function CanvasObjectGroup({ object, objectScale = 1, pose, drag, viewport, children }) {
 const box=useMemo(()=>routingObjects([object])[0],[object.id,object.x,object.y,object.width,object.height,object.type,object.sourceLink?.sourceType]);
 const localPose=useDerivedValue(()=>{const p=pose.get(),o=previewBox(box,drag.get());return {scale:p.scale*objectScale*Math.min(o.width/box.width,o.height/box.height),x:p.x+o.x*p.scale,y:p.y+o.y*p.scale};});
 const props=useAnimatedProps(()=>{
  const o=previewBox(box,drag.get());
  return {matrix:[o.width/box.width,0,0,o.height/box.height,o.x,o.y],display:batchVisible({x:o.x,y:o.y,width:o.width,height:o.height},pose.get(),viewport)?'inline':'none'};
 });
 return <Group transform={`translate(${object.x},${object.y})`} animatedProps={props}>{typeof children==='function'?children(localPose):children}</Group>;
}
export function CanvasEdge({ a,b,drag,color,style,objects,label,initialGeometry }) {
 const initial=useMemo(()=>{if(initialGeometry)return initialGeometry;const d=connectorPath(a,b,null,style,objects);return {d,at:label?pathLabel(d):{x:0,y:0},bounds:pathBounds(d)};},[a,b,style,objects,label,initialGeometry]);
 const geometry=useDerivedValue(()=>{const moving=drag.get();if(!routeAffected(a.id,b.id,moving,initial.bounds))return initial;const d=connectorPath(a,b,moving,style,objects);return {d,at:label?pathLabel(d):{x:0,y:0}};});
 const props=useAnimatedProps(()=>({d:geometry.get().d})),text=useAnimatedProps(()=>({...geometry.get().at,opacity:geometry.get().d?1:0}));
 return <><Edge animatedProps={props} d={initial.d} stroke={color} strokeWidth={1.6} fill="none"/>{label?<Label animatedProps={text} textAnchor="middle" fill={color} fontSize={12}>{label}</Label>:null}</>;
}
