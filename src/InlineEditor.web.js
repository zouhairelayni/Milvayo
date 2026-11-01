import React from 'react';
import { View } from 'react-native';
export default function InlineEditor({ expanded, style, children }) {
  return expanded ? <View style={style}>{children}</View> : null;
}
