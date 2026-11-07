// /src/screens/canvas/CanvasSvgButton.js
import {View} from 'react-native';
import Svg,{Path} from 'react-native-svg';
import PressSurface from '../../ui/PressSurface';
import {T} from '../../ui/uiBase';
import {useTheme} from '../../ui/theme/theme';
const PATHS={curve:'M 4 18 C 20 18, 4 6, 20 6',straight:'M 4 18 L 20 6',elbow:'M 4 18 H 12 V 6 H 20',save:'M 4 12 L 10 18 L 20 6',style:'M 4 6 H 20 M 4 12 H 20 M 4 18 H 20 M 8 3 V 9 M 16 9 V 15 M 10 15 V 21',fit:'M 8 3 H 3 V 8 M 16 3 H 21 V 8 M 21 16 V 21 H 16 M 8 21 H 3 V 16',delete:'M 4 7 H 20 M 9 7 V 4 H 15 V 7 M 7 7 L 8 20 H 16 L 17 7 M 10 10 V 17 M 14 10 V 17'};
export default function CanvasSvgButton({label,kind,onPress,active=false,disabled=false}){
 const {c}=useTheme(),ink=active?c.onSelection:c.ink;
 return <PressSurface accessibilityRole="button" accessibilityLabel={label} accessibilityState={{selected:active,disabled}} disabled={disabled} onPress={onPress} style={{minWidth:48,minHeight:48,padding:4,borderRadius:8,backgroundColor:active?c.selection:'transparent',alignItems:'center',justifyContent:'center',gap:4}}><View pointerEvents="none"><Svg width={18} height={18} viewBox="0 0 24 24"><Path d={PATHS[kind]} fill="none" stroke={ink} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></Svg></View><T size={12} color={ink}>{label}</T></PressSurface>;
}
