// /src/screens/canvas/CanvasAddMenu.js
import {ScrollView,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../ui/theme/theme';
import {T,IconBtn} from '../../ui/ui';
import {CanvasTool} from './CanvasToolbar';
import CanvasMenuRow from './CanvasMenuRow';
export default function CanvasAddMenu({height,bottom,onAdd,onSource,onProjectDiagram,onClose}){
 const {c}=useTheme(),insets=useSafeAreaInsets();
 bottom+=Math.max(0,insets.bottom-12);
 return <View accessibilityLabel="Add to Canvas" style={{position:'absolute',left:12,right:12,bottom,maxWidth:420,alignSelf:'center',maxHeight:Math.max(120,height-bottom-12),backgroundColor:c.surface,borderRadius:16,borderWidth:1,borderColor:c.line,overflow:'hidden'}}>
  <View style={{flexDirection:'row',alignItems:'center',paddingLeft:16,paddingRight:4}}><T size={16} weight="600" style={{flex:1}}>Add to Canvas</T><IconBtn icon="x" label="Close Add to Canvas" onPress={onClose}/></View>
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:12,paddingTop:0,gap:12}}>
   <View style={{gap:4}}><T size={12} muted>Create</T><View style={{flexDirection:'row',flexWrap:'wrap',gap:4}}>{[['note','Note','file-text'],['text','Text','type'],['shape','Shape','square'],['card','Card','credit-card'],['frame','Frame','layout']].map(([type,label,icon])=><CanvasTool key={type} label={label} icon={icon} onPress={()=>onAdd(type)}/>)}</View></View>
   <View style={{gap:4}}><T size={12} muted>Diagrams</T><View style={{flexDirection:'row',flexWrap:'wrap',gap:4}}>{[['tree','Tree','git-branch'],['fishbone','Fishbone','list'],['mind','Mind map','share-2']].map(([kind,label,icon])=><CanvasTool key={kind} label={label} icon={icon} onPress={()=>onAdd('diagram',kind)}/>)}</View></View>
   <View style={{gap:0}}><T size={12} muted>Project sources</T><CanvasMenuRow label="Project diagram" icon="git-branch" onPress={onProjectDiagram}/><CanvasMenuRow label="Tasks, WBS and artifacts" icon="link" onPress={onSource}/></View>
  </ScrollView>
 </View>;
}
