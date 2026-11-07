// /src/governance/wbsviews.js
// A bounded geometry cache owns scenes. Weak paint records disappear when those scenes are evicted.
import { cloneElement, memo, useMemo } from 'react';
import { Path, Rect, Text as SvgText } from 'react-native-svg';
import { font, useTheme } from '../ui/theme/theme';
import DiagramSvg from './DiagramSvg';
import { useRenderMetric } from '../diagnostics/useRenderMetric';
import { diagnosticMonitor } from '../diagnostics/monitor';
export { BRANCH, treeScene, fishboneScene, mindScene, sceneFor, sceneToSvg } from './diagramScene.cjs';

const paint = new WeakMap();
const counts = { generations: 0, hits: 0 };
export const diagramPaintStats = () => ({ ...counts });
function painted(scene, c) {
  const colors = [c.ink, c.bg, c.surface, c.muted];
  const prior = paint.get(scene);
  if (prior && colors.every((color, i) => color === prior.colors[i])) { counts.hits++; return prior.children; }
  const k = v => (v && c[v]) || v;
  const children = diagnosticMonitor.measureWork('diagram/svg-build', () => scene.items.map((it, i) => {
    if (it.t === 'rect') return <Rect key={i} x={it.x} y={it.y} width={it.w} height={it.h} rx={it.r} fill={k(it.fill)} stroke={k(it.stroke)} strokeWidth={it.sw} />;
    if (it.t === 'path') return <Path key={i} d={it.d} stroke={k(it.stroke)} strokeWidth={it.sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
    return <SvgText key={i} x={it.x} y={it.y} fontSize={it.size} fontWeight={it.weight} fill={k(it.fill)} textAnchor={it.anchor} opacity={it.op} fontFamily={font}>{it.s}</SvgText>;
  }));
  counts.generations++; diagnosticMonitor.recordAction(`diagram SVG primitives generated: ${scene.items.length}`); paint.set(scene, { colors, children }); return children;
}

export const Scene = memo(function Scene({ scene, scale = 1, viewport, pose, svgRef, onSelect, background = false, onReady }) {
  useRenderMetric('projects/wbs/svg');
  const { c } = useTheme();
  const base = useMemo(() => diagnosticMonitor.measureWork('diagram/svg-primitives', () => painted(scene, c)), [scene, c.ink, c.bg, c.surface, c.muted]);
  const children = useMemo(() => onSelect ? base.map((element, i) => {
    const id = scene.items[i].nodeId;
    return id ? cloneElement(element, { onPress: () => onSelect(id), accessibilityLabel: `Inspect ${scene.items[i].nodeName || id}`, accessible: true }) : element;
  }) : base, [base, scene, onSelect]);
  return <DiagramSvg scene={scene} scale={scale} viewport={viewport} pose={pose} svgRef={svgRef} onReady={onReady}>
    {background ? <Rect x={0} y={0} width={scene.width} height={scene.height} fill={c.bg}/> : null}
    {children}
  </DiagramSvg>;
});
