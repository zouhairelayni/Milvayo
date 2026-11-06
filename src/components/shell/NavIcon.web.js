// /src/components/shell/NavIcon.web.js
import {View} from 'react-native';
import {Feather} from '@expo/vector-icons';
export default function NavIcon({name,color,selected}){
 return <View pointerEvents="none" style={{width:48,height:28,alignItems:'center',justifyContent:'center'}}>
  <View style={{transform:[{scale:selected?1.2:1}],transitionProperty:'transform',transitionDuration:'150ms',transitionTimingFunction:'cubic-bezier(.23,1,.32,1)'}}><Feather name={name} size={20} color={color}/></View>
 </View>;
}
