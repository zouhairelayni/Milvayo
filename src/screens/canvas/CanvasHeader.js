// /src/screens/canvas/CanvasHeader.js
import {View} from 'react-native';
import {Feather} from '@expo/vector-icons';
import PressSurface from '../../ui/PressSurface';
import {T} from '../../ui/uiBase';
import {useTheme} from '../../ui/theme/theme';
function Action({label,icon,onPress,disabled=false,children}){
 const {c}=useTheme();
 return <PressSurface accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={{width:48,minHeight:48,alignItems:'center',justifyContent:'center',gap:2,borderRadius:8}}><Feather name={icon} size={18} color={c.ink}/>{children}</PressSurface>;
}
export default function CanvasHeader({title,zoom,onBack,onUndo,onRedo,canUndo,canRedo,onFit,onMore}){
 const {c}=useTheme();
 return <View style={{minHeight:56,paddingHorizontal:8,paddingVertical:4,flexDirection:'row',alignItems:'center',backgroundColor:c.bg,borderBottomWidth:1,borderColor:c.line}}>
  <Action label="Go back" icon="chevron-left" onPress={onBack}/><T size={16} weight="600" numberOfLines={2} style={{flex:1,minWidth:0,paddingHorizontal:4}}>{title}</T>
  <Action label="Undo" icon="corner-up-left" disabled={!canUndo} onPress={onUndo}/><Action label="Redo" icon="corner-up-right" disabled={!canRedo} onPress={onRedo}/>
  <Action label={`Fit all Canvas objects, ${Math.round(zoom*100)}% zoom`} icon="maximize" onPress={onFit}><T size={11} style={{fontVariant:['tabular-nums']}}>{Math.round(zoom*100)}%</T></Action>
  <Action label="Canvas board actions" icon="more-vertical" onPress={onMore}/>
 </View>;
}
