// /src/components/loading/SkeletonMotionSurface.web.js
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
export default function SkeletonMotionSurface({ active = true, children, style }) {
  const ref = useRef(null);
  useEffect(() => {
    const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let animation;
    const update = () => {
      animation?.cancel();
      if (active && !preference?.matches) animation = ref.current?.animate?.([{ opacity: 1 }, { opacity: 0.58 }], { duration: 1000, direction: 'alternate', iterations: Infinity, easing: 'ease-in-out' });
    };
    update(); preference?.addEventListener?.('change', update);
    return () => { animation?.cancel(); preference?.removeEventListener?.('change', update); };
  }, [active]);
  return <View ref={ref} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={style}>{children}</View>;
}
