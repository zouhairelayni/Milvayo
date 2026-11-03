// /src/app/AppGestureRoot.native.js
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Only the gesture-handler root. Detectors live with the screens that use them (see TimelineGestureHost),
// so nothing here can change identity and remount the app.
export default function AppGestureRoot({ children }) {
  return <GestureHandlerRootView style={{ flex: 1 }}>{children}</GestureHandlerRootView>;
}
