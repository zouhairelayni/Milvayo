// /src/governance/DiagramSvg.js
import Svg from 'react-native-svg';
export default function DiagramSvg({ scene, scale = 1, svgRef, children, onReady }) {
  return <Svg ref={svgRef} width={scene.width * scale} height={scene.height * scale} viewBox={`0 0 ${scene.width} ${scene.height}`} onLayout={onReady}>{children}</Svg>;
}
