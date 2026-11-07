// /src/screens/canvas/CanvasAddMenu.js
import {View} from 'react-native';
import {T} from '../../ui/uiBase';
import CanvasPopover from './CanvasPopover';
import {CanvasTool} from './CanvasToolbar';
export default function CanvasAddMenu({viewport,onAdd,onSource,onProjectDiagram,onClose}){
 const landscape=viewport.width>=700&&viewport.height<500;
 return <CanvasPopover title="Add to Canvas" viewport={viewport} extent={landscape?560:320} onClose={onClose}>
  <View style={{gap:4}}><T size={12} muted>Create</T><View style={{flexDirection:'row',justifyContent:'space-between'}}>{[['note','Note','file-text'],['text','Text','type'],['shape','Shape','square'],['card','Card','credit-card'],['frame','Frame','layout']].map(([type,label,icon])=><CanvasTool key={type} label={label} icon={icon} onPress={()=>onAdd(type)}/>)}</View></View>
  <View style={{gap:4,flexDirection:landscape?'row':'column'}}>
   <View style={{gap:4,...(landscape?{flex:1}:{})}}><T size={12} muted>Diagrams</T><View style={{flexDirection:'row',gap:4}}>{[['tree','Tree','git-branch'],['fishbone','Fishbone','list'],['mind','Mind map','share-2']].map(([kind,label,icon])=><CanvasTool key={kind} label={label} icon={icon} onPress={()=>onAdd('diagram',kind)}/>)}</View></View>
   <View style={{gap:4,...(landscape?{flex:1}:{})}}><T size={12} muted>Project</T><View style={{flexDirection:'row',gap:8}}><CanvasTool label="Project diagram" icon="git-branch" onPress={onProjectDiagram}/><CanvasTool label="Project sources" icon="link" onPress={onSource}/></View></View>
  </View>
 </CanvasPopover>;
}
