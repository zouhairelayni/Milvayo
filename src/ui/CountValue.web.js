// /src/ui/CountValue.web.js
import {View} from 'react-native';
import {T} from './uiBase';
import Reveal from './Reveal';
export default function CountValue({value,size=28,color,weight='500'}){
 return <View style={{height:Math.round(size*1.3),overflow:'hidden',justifyContent:'center'}}><Reveal key={String(value)} duration={180} distance={4}><T size={size} weight={weight} color={color} style={{fontVariant:['tabular-nums']}}>{value}</T></Reveal></View>;
}
