// /src/governance/DiagramBatches.native.js
import { Children, useMemo } from 'react';
import { G } from 'react-native-svg';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
const {batchVisible}=require('./diagramVisibility.cjs');
const Group=Animated.createAnimatedComponent(G);
function Batch({bounds,pose,viewport,children}){
 const props=useAnimatedProps(()=>({display:batchVisible(bounds,pose.get(),viewport)?'inline':'none'}));
 return <Group animatedProps={props}>{children}</Group>;
}
export default function DiagramBatches({scene,pose,viewport,children}){
 const groups=useMemo(()=>{
  if(!scene.batches||!pose||!viewport)return children;const elements=Children.toArray(children);
  return scene.batches.map((batch,i)=><Batch key={i} bounds={batch.bounds} pose={pose} viewport={viewport}>{batch.indexes.map(index=>elements[index])}</Batch>);
 },[scene,pose,viewport?.width,viewport?.height,children]);return <>{groups}</>;
}
