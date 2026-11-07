// /src/screens/canvas/CanvasMenuRow.js
import {Pressable,View} from 'react-native';
import {Feather} from '@expo/vector-icons';
import {T} from '../../ui/uiBase';
import {useTheme} from '../../ui/theme/theme';
export default function CanvasMenuRow({label,icon='chevron-right',detail,onPress,disabled=false,danger=false,selected=false}){
 const {c}=useTheme();
 return <Pressable accessibilityRole="button" accessibilityLabel={detail?`${label}, ${detail}`:label} accessibilityState={{disabled,selected}} disabled={disabled} onPress={onPress}
  style={({pressed})=>({minHeight:48,flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:12,paddingVertical:8,borderRadius:12,backgroundColor:pressed?c.selection:'transparent',opacity:disabled ? 0.38 : 1})}>
  <Feather name={icon} size={18} color={danger?c.danger:c.muted}/><View style={{flex:1,minWidth:0,gap:4}}><T size={14} weight="500" color={danger?c.danger:c.ink}>{label}</T>{detail?<T size={12} muted>{detail}</T>:null}</View>
  {selected?<Feather name="check" size={18} color={c.accentText}/>:null}
 </Pressable>;
}
