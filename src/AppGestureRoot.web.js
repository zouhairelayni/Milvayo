import React from 'react';
import { View } from 'react-native';
// Keep browser layout identical to the mock, without native gesture wrappers.
export default function AppGestureRoot({ children }) { return <View style={{ flex: 1 }}>{children}</View>; }
