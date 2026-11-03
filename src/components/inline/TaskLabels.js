// /src/components/inline/TaskLabels.js
import { Pressable, View } from 'react-native';
import { T } from '../../ui/ui';
import { labelColor, textColor } from '../../ui/labelPalette.cjs';
export default function TaskLabels({labels=[], colors={}, onPress, compact=false}) {
  if (!labels.length) return null;
  return <View style={{flexDirection:'row',flexWrap:'wrap',gap:6,alignItems:'center'}}>
    {labels.map(name=>{const color=labelColor(name,colors);const style={backgroundColor:color,paddingHorizontal:compact?8:10,paddingVertical:compact?3:5,borderRadius:5,minHeight:onPress?44:compact?24:30,justifyContent:'center'};const text=<T size={compact?11:12} weight="600" color={textColor(color)} numberOfLines={1}>{name}</T>;return onPress?<Pressable key={name} onPress={()=>onPress(name)} accessibilityRole="button" accessibilityLabel={`Edit label ${name}`} style={style}>{text}</Pressable>:<View key={name} style={style}>{text}</View>;})}
  </View>;
}
