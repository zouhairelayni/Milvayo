// /src/components/shell/MenuToggle.js
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';
import { radius, useTheme } from '../../ui/theme/theme';

export default function MenuToggle({ open, onPress, animateBeforeClose = false }) {
  const { c } = useTheme();
  const progress = useRef(new Animated.Value(0)).current;
  const timing = (toValue) => Animated.timing(progress, {
    toValue, duration: 190, easing: Easing.inOut(Easing.quad), useNativeDriver: true,
  });
  useEffect(() => { const animation = timing(open ? 1 : 0); animation.start(); return () => animation.stop(); }, [open, progress]);
  const press = () => {
    if (open && animateBeforeClose) timing(0).start(({ finished }) => { if (finished) onPress(); });
    else onPress();
  };
  const rotation = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });
  return <Pressable accessibilityRole="button" accessibilityLabel={open ? 'Close menu' : 'Open menu'}
    accessibilityState={{ expanded: !!open }} onPress={press} hitSlop={4}
    style={({ pressed }) => ({ width: 40, height: 40, borderRadius: radius.sm, justifyContent: 'center', alignItems: 'center',
      backgroundColor: c.surfaceAlt, opacity: pressed ? .75 : 1 })}>
    <Animated.View style={{ width: 21, height: 21, alignItems: 'center', justifyContent: 'space-evenly',
      transform: [{ rotate: rotation }] }}>
      {[0, 1, 2].map(i => <View key={i} style={{ width: 18, height: 2, borderRadius: 1, backgroundColor: c.ink }} />)}
    </Animated.View>
  </Pressable>;
}
