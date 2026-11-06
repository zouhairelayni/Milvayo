// /src/screens/timeline/TimelineZoomControls.js
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../../ui/theme/theme';
function ZoomButton({ plus, disabled, onPress }) {
  const { c } = useTheme();
  const [focused, setFocused] = useState(false);
  const label = plus ? 'Zoom in' : 'Zoom out';
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }}
    disabled={disabled} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    {...(Platform.OS === 'web' ? { title: label } : {})}
    style={({ pressed, hovered }) => ({ width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
      backgroundColor: pressed || hovered ? c.surfaceAlt : c.surface + 'E6',
      borderRadius: 10, borderWidth: 1, borderColor: focused ? c.accentText : c.line,
      opacity: disabled ? 0.4 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" pointerEvents="none">
      <Circle cx={10} cy={10} r={6.5} stroke={c.ink} strokeWidth={1.7}/>
      <Path d="M15 15L21 21M7 10H13" stroke={c.ink} strokeWidth={1.7} strokeLinecap="round"/>
      {plus ? <Path d="M10 7V13" stroke={c.ink} strokeWidth={1.7} strokeLinecap="round"/> : null}
    </Svg>
  </Pressable>;
}
export default function TimelineZoomControls({ onZoomIn, onZoomOut, canZoomIn = true, canZoomOut = true }) {
  return <View pointerEvents="box-none" style={{ position: 'absolute', top: 8, right: 8, zIndex: 20, flexDirection: 'row', gap: 8 }}>
    <ZoomButton onPress={onZoomOut} disabled={!canZoomOut}/>
    <ZoomButton plus onPress={onZoomIn} disabled={!canZoomIn}/>
  </View>;
}
