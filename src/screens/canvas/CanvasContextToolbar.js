// /src/screens/canvas/CanvasContextToolbar.js
import {View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {CanvasTool,CanvasToolGroup} from './CanvasToolbar';
import CanvasSwatches from './CanvasSwatches';
export default function CanvasContextToolbar({object,count,onEdit,onColor,onDuplicate,onConnect,onMore,onGroup,onDelete,onLayout,onSource,sourceAvailable,onWidth}){
 const insets=useSafeAreaInsets();
 if(!object)return null;
 const diagram=object.type==='diagram'||['wbs','taskDiagram'].includes(object.sourceLink?.sourceType),colors=!diagram&&object.type!=='frame';
 return <View pointerEvents="box-none" style={{position:'absolute',left:12,right:12,bottom:Math.max(12,insets.bottom)+72,alignItems:'center'}}>
  <CanvasToolGroup style={{flexDirection:'column',alignItems:'stretch',maxWidth:'100%'}}>
   <View style={{flexDirection:'row',justifyContent:'center',gap:4}}>
    {count>1?<><CanvasTool label="Group" icon="layers" onPress={onGroup} disabled={object.locked}/><CanvasTool label="Delete" icon="trash-2" onPress={onDelete} disabled={object.locked}/></>:<>
     {object.type==='linked'?<CanvasTool label="Source" icon="external-link" onPress={onSource} disabled={!sourceAvailable}/>:object.type==='draw'?<CanvasTool label="Width" icon="sliders" onPress={onWidth} disabled={object.locked}/>:<CanvasTool label="Edit" icon="edit-3" onPress={onEdit} disabled={object.locked}/>}
     {diagram?<CanvasTool label="Layout" icon="git-branch" onPress={onLayout} disabled={object.locked}/>:null}
    </>}
    <CanvasTool label="Duplicate" icon="copy" onPress={onDuplicate}/><CanvasTool label="Connect" icon="git-merge" onPress={onConnect}/><CanvasTool label="More" icon="more-horizontal" onPress={onMore}/>
   </View>
   {colors&&count===1?<View style={{alignItems:'center'}}><CanvasSwatches value={object.color} disabled={object.locked} onChange={onColor}/></View>:null}
  </CanvasToolGroup>
 </View>;
}
