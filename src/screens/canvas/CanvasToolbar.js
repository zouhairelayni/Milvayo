// /src/screens/canvas/CanvasToolbar.js
import {View, useWindowDimensions} from 'react-native';
import {Feather} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import PressSurface from '../../ui/PressSurface';
import {T} from '../../ui/uiBase';
import {useTheme} from '../../ui/theme/theme';

export function CanvasTool({label,icon,onPress,active=false,disabled=false,caption=true,menu=false}){
 const {c}=useTheme(),{fontScale=1}=useWindowDimensions();
 return <PressSurface accessibilityRole="button" accessibilityLabel={label} accessibilityState={{selected:active,disabled}} disabled={disabled} onPress={onPress}
  style={{minWidth:48,minHeight:48,paddingHorizontal:8,paddingVertical:4,alignItems:'center',justifyContent:'center',gap:4,borderRadius:12,backgroundColor:active?c.selection:'transparent'}}>
  <Feather name={icon} size={18} color={active?c.onSelection:c.ink}/>{caption&&fontScale<=1.1?<View style={{flexDirection:'row',alignItems:'center',gap:2}}><T size={12} weight="500" color={active?c.onSelection:c.ink}>{label}</T>{menu?<Feather name="chevron-down" size={12} color={active?c.onSelection:c.ink}/>:null}</View>:null}
 </PressSurface>;
}
export function CanvasToolGroup({children,style}){
 const {c}=useTheme();
 return <View style={[{flexDirection:'row',alignItems:'center',padding:4,gap:4,borderRadius:16,backgroundColor:c.surface,borderWidth:1,borderColor:c.line},style]}>{children}</View>;
}
export default function CanvasToolbar({mode,panel,onTool}){
 const insets=useSafeAreaInsets();
 const active=panel==='add'?'add':panel==='tools'?'more':mode==='multi'?'select':mode==='erase'?'draw':mode==='connect'||mode==='comment'?'select':mode;
 return <View pointerEvents="box-none" style={{position:'absolute',left:12,right:12,bottom:Math.max(12,insets.bottom),alignItems:'center'}}>
  <CanvasToolGroup>{[['select','Select',mode==='multi'?'check-square':'mouse-pointer'],['add','Add','plus'],['draw','Draw','edit-2'],['more','More','more-horizontal']].map(([tool,label,icon])=><CanvasTool key={tool} label={label} icon={icon} menu={tool==='select'} active={tool===active} onPress={()=>onTool(tool)}/>)}</CanvasToolGroup>
 </View>;
}
