// /src/gestures/DiagramViewport.js
import { useState } from 'react';
import { View } from 'react-native';
import DiagramGesture from './DiagramGesture';
const { fitScale } = require('./diagramZoom.cjs');

export default function DiagramViewport({ scene, scale, resetKey, onZoom, children }) {
  const [width, setWidth] = useState(0);
  const height = Math.min(440, scene.height);
  const bounds = { width, height, contentWidth: scene.width, contentHeight: scene.height };
  return (
    <View onLayout={e => setWidth(e.nativeEvent.layout.width)} style={{ width: '100%', height, overflow: 'hidden' }}>
      {width > 0 ? (
        <DiagramGesture bounds={bounds} initialScale={scale === 'fit' ? fitScale(bounds) : scale} resetKey={resetKey} onZoom={onZoom}>
          {children}
        </DiagramGesture>
      ) : null}
    </View>
  );
}
