// /src/components/inline/InlineEditor.native.js
import React from 'react';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

// Animates the existing inline layout; does not change the mock's padding/spacing.
export default function InlineEditor({ expanded, style, children }) {
  return <Animated.View layout={LinearTransition.duration(160)}>
    {expanded ? <Animated.View entering={FadeIn.duration(130)} exiting={FadeOut.duration(100)} style={style}>{children}</Animated.View> : null}
  </Animated.View>;
}
