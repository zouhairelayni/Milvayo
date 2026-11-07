// /src/gestures/DiagramViewport.js
import { cloneElement, useCallback, useState } from 'react';
import { View } from 'react-native';
import DiagramGesture from './DiagramGesture';
const { fitScale } = require('./diagramZoom.cjs');

export default function DiagramViewport({ scene, scale, resetKey, onZoom, onPose, initialPose, fullScreen = false, fitAll = false, viewportHeight, children }) {
  const [width, setWidth] = useState(0);
  const height = viewportHeight || Math.min(440, scene.height);
  const bounds = { width, height, contentWidth: scene.width, contentHeight: scene.height, ...((fullScreen || fitAll) ? { minScale: Math.max(0.00001, Math.min(0.25, (width - 4) / scene.width, height / scene.height)), fullScreen, center: fullScreen } : {}) };
  const renderViewport = useCallback((pose, w, h, cameraInitial) => cloneElement(children, { pose, cameraInitial, viewport: { width: w, height: h } }), [children]);
  return (
    <View onLayout={e => setWidth(e.nativeEvent.layout.width)} style={{ width: '100%', height, overflow: 'hidden' }}>
      {width > 0 ? (
        <DiagramGesture bounds={bounds} initialScale={scale === 'fit' ? fitScale(bounds) : scale} resetKey={resetKey} onZoom={onZoom} onPose={onPose} initialPose={initialPose} renderViewport={renderViewport}>
          {children}
        </DiagramGesture>
      ) : null}
    </View>
  );
}
