// /src/screens/canvas/CanvasToolbar.js
import {View, useWindowDimensions} from 'react-native';
import {Feather} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import PressSurface from '../../ui/PressSurface';
import {T} from '../../ui/uiBase';
import {useTheme} from '../../ui/theme/theme';

export function CanvasTool({label,icon,onPress,active=false,disabled=false,caption=true}){
 const {c}=useTheme(),{fontScale=1}=useWindowDimensions();
 return <PressSurface accessibilityRole="button" accessibilityLabel={label} accessibilityState={{selected:active,disabled}} disabled={disabled} onPress={onPress}
  style={{minWidth:48,minHeight:48,paddingHorizontal:8,paddingVertical:4,alignItems:'center',justifyContent:'center',gap:4,borderRadius:12,backgroundColor:active?c.selection:'transparent'}}>
  <Feather name={icon} size={18} color={active?c.onSelection:c.ink}/>{caption&&fontScale<=1.1?<T size={12} weight="500" color={active?c.onSelection:c.ink}>{label}</T>:null}
 </PressSurface>;
}
export function CanvasToolGroup({children,style}){
 const {c}=useTheme();
 return <View style={[{flexDirection:'row',alignItems:'center',padding:4,gap:4,borderRadius:16,backgroundColor:c.surface,borderWidth:1,borderColor:c.line},style]}>{children}</View>;
}
export default function CanvasToolbar({mode,panel,onTool,onUndo,onRedo,canUndo,canRedo}){
 const insets=useSafeAreaInsets();
 return <>
  <View pointerEvents="box-none" style={{position:'absolute',left:12,right:12,bottom:Math.max(12,insets.bottom),alignItems:'center'}}>
   <CanvasToolGroup>{[['select','Select','mouse-pointer'],['add','Add','plus'],['draw','Draw','edit-2'],['connect','Connect','git-merge'],['more','More','more-horizontal']].map(([tool,label,icon])=><CanvasTool key={tool} label={label} icon={icon} active={tool==='add'?panel==='add':tool==='more'?panel==='tools':tool==='select'?mode==='select'||mode==='multi':tool==='draw'?mode==='draw'||mode==='erase':mode===tool} onPress={()=>onTool(tool)}/>)}</CanvasToolGroup>
  </View>
  <CanvasToolGroup style={{position:'absolute',top:12,right:12}}><CanvasTool label="Undo" icon="corner-up-left" caption={false} disabled={!canUndo} onPress={onUndo}/><CanvasTool label="Redo" icon="corner-up-right" caption={false} disabled={!canRedo} onPress={onRedo}/></CanvasToolGroup>
 </>;
}
