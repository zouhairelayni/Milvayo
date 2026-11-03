// /src/components/inline/TaskLabels.js
import { Pressable, View } from 'react-native';
import { T } from '../../ui/ui';
import { labelColor, textColor } from '../../ui/labelPalette.cjs';
export default function TaskLabels({labels=[], colors={}, onPress, compact=false}) {
  if (!labels.length) return null;
  return <View style={{flexDirection:'row',flexWrap:'wrap',gap:6,alignItems:'center'}}>
    {labels.map(name=>{const color=labelColor(name,colors);return <Pressable key={name} disabled={!onPress} onPress={()=>onPress(name)} accessibilityRole={onPress?'button':undefined} accessibilityLabel={`Label ${name}`} style={{backgroundColor:color,paddingHorizontal:compact?8:10,paddingVertical:compact?3:5,borderRadius:5,minHeight:compact?19:26,justifyContent:'center'}}><T size={compact?10:12} weight="700" color={textColor(color)} numberOfLines={1}>{name}</T></Pressable>;})}
  </View>;
}
