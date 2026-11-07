// /src/screens/canvas/CanvasSwatches.js
import {View} from 'react-native';
import {Feather} from '@expo/vector-icons';
import PressSurface from '../../ui/PressSurface';
import {useTheme} from '../../ui/theme/theme';
const {COLORS}=require('../../canvas/editorTools.cjs');
export default function CanvasSwatches({value,onChange,disabled=false}){
 const {c}=useTheme();
 return <View accessibilityRole="radiogroup" accessibilityLabel="Canvas color" style={{flexDirection:'row',gap:4,flexWrap:'wrap'}}>
  {COLORS.map(({label,value:color})=><PressSurface key={label} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{checked:value===color,disabled}} disabled={disabled} onPress={()=>onChange(color)}
   style={{width:48,height:48,alignItems:'center',justifyContent:'center',borderRadius:12,borderWidth:2,borderColor:value===color?c.accentText:'transparent'}}>
   <View style={{width:28,height:28,borderRadius:14,backgroundColor:color||c.surfaceAlt,borderWidth:1,borderColor:c.muted,alignItems:'center',justifyContent:'center'}}>{value===color?<Feather name="check" size={16} color={color?'#172331':c.ink}/>:null}</View>
  </PressSurface>)}
 </View>;
}
