// /src/governance/DiagramSvg.native.js
import Svg from 'react-native-svg';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

function CameraSvg({ scene, viewport, pose, children, svgRef }) {
  // Native SVG consumes minX/minY/vbWidth/vbHeight directly. No enormous scene-size bitmap,
  // JS frame callbacks, re-rendered labels, or Timeline gesture changes.
  const camera = useAnimatedProps(() => {
    const p = pose.get();
    return { minX: -p.x / p.scale, minY: -p.y / p.scale, vbWidth: viewport.width / p.scale, vbHeight: viewport.height / p.scale };
  });
  return <AnimatedSvg ref={svgRef} width={viewport.width} height={viewport.height} viewBox={`0 0 ${scene.width} ${scene.height}`} animatedProps={camera} preserveAspectRatio="xMinYMin meet">{children}</AnimatedSvg>;
}

export default function DiagramSvg({ scene, scale = 1, viewport, pose, svgRef, children, onReady }) {
  if (viewport && pose) return <CameraSvg scene={scene} viewport={viewport} pose={pose} svgRef={svgRef}>{children}</CameraSvg>;
  // Only the on-demand export surface uses this path. Its physical size is bounded too;
  // toDataURL's target dimensions rasterize the complete viewBox independently of the camera.
  const factor = Math.min(scale, 512 / scene.width, 512 / scene.height);
  return <Svg ref={svgRef} width={Math.max(1, scene.width * factor)} height={Math.max(1, scene.height * factor)} viewBox={`0 0 ${scene.width} ${scene.height}`} onLayout={onReady}>{children}</Svg>;
}
