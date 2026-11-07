// /src/governance/DiagramSvg.native.js
import { Children, useMemo } from 'react';
import Svg, { G } from 'react-native-svg';
const { batchVisible } = require('./diagramVisibility.cjs');
import Animated, { useAnimatedProps } from 'react-native-reanimated';
const AnimatedSvg = Animated.createAnimatedComponent(Svg);
const AnimatedGroup = Animated.createAnimatedComponent(G);

function CameraBatch({ bounds, viewport, pose, children }) {
  // display=none skips native child traversal; opacity creates extra Android bitmaps.
  const visible = useAnimatedProps(() => ({ display: batchVisible(bounds, pose.get(), viewport) ? 'inline' : 'none' }));
  return <AnimatedGroup animatedProps={visible}>{children}</AnimatedGroup>;
}

function CameraSvg({ scene, viewport, pose, cameraInitial = { scale: 1, x: 0, y: 0 }, children, svgRef }) {
  // Svg extracts viewBox AFTER forwarded props, overwriting initial animated camera fields.
  // Supply native camera fields directly so the first render and later zooms have the same aspect.
  // Native SVG consumes minX/minY/vbWidth/vbHeight directly. No enormous scene-size bitmap,
  // JS frame callbacks, re-rendered labels, or Timeline gesture changes.
  const groups = useMemo(() => {
    if (!scene.batches) return children;
    const elements = Children.toArray(children);
    return scene.batches.map((batch, i) => <CameraBatch key={i} bounds={batch.bounds} viewport={viewport} pose={pose}>
      {batch.indexes.map(index => elements[index])}
    </CameraBatch>);
  }, [scene, children, viewport.width, viewport.height, pose]);
  const camera = useAnimatedProps(() => {
    const p = pose.get();
    return { minX: -p.x / p.scale, minY: -p.y / p.scale, vbWidth: viewport.width / p.scale, vbHeight: viewport.height / p.scale };
  });
  return <AnimatedSvg ref={svgRef} width={viewport.width} height={viewport.height} minX={-cameraInitial.x / cameraInitial.scale} minY={-cameraInitial.y / cameraInitial.scale}
    vbWidth={viewport.width / cameraInitial.scale} vbHeight={viewport.height / cameraInitial.scale} align="xMinYMin" meetOrSlice={0} animatedProps={camera}>{groups}</AnimatedSvg>;
}

export default function DiagramSvg({ scene, scale = 1, viewport, pose, cameraInitial, svgRef, children, onReady }) {
  if (viewport && pose) return <CameraSvg scene={scene} viewport={viewport} pose={pose} cameraInitial={cameraInitial} svgRef={svgRef}>{children}</CameraSvg>;
  // Only the on-demand export surface uses this path. Its physical size is bounded too;
  // toDataURL's target dimensions rasterize the complete viewBox independently of the camera.
  const factor = Math.min(scale, 512 / scene.width, 512 / scene.height);
  return <Svg ref={svgRef} width={Math.max(1, scene.width * factor)} height={Math.max(1, scene.height * factor)} viewBox={`0 0 ${scene.width} ${scene.height}`} onLayout={onReady}>{children}</Svg>;
}
