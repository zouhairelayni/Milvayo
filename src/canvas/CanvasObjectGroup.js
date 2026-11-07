// /src/canvas/CanvasObjectGroup.js
import { G, Path, Text as SvgText } from 'react-native-svg';
const {pathLabel}=require('./routing.cjs');
const {connectorPath}=require('./interaction.cjs');
export default function CanvasObjectGroup({object,children}){return <G id={`canvas-object-${object.id}`} transform={`translate(${object.x},${object.y})`}>{typeof children==='function'?children():children}</G>;}
export function CanvasEdge({a,b,id,color,style,objects,label,initialGeometry}){const path=initialGeometry?.d??connectorPath(a,b,null,style,objects),at=label?(initialGeometry?.at||pathLabel(path)):null;return <><Path id={`canvas-edge-${id}`} d={path} stroke={color} strokeWidth={1.6} fill="none"/>{label&&path?<SvgText id={`canvas-edge-label-${id}`} x={at.x} y={at.y} textAnchor="middle" fill={color} fontSize={12}>{label}</SvgText>:null}</>;}
