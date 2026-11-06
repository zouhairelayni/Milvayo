// /src/components/illustrations/TourArtwork.js
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import Reveal from '../../ui/Reveal';
import { useTheme } from '../../ui/theme/theme';

// First-run tour drawings, in the same language as EmptyArtwork: a soft selection disc, surface panels, hairlines,
// and the accent, info and success colours as the only colour. Original geometry; decorative only.
export const TOUR_KINDS = ['board', 'timeline', 'release', 'sprint', 'blank'];

export default function TourArtwork({ kind = 'board', size = 156 }) {
  const { c } = useTheme();
  const panel = { fill: c.surface, stroke: c.line, strokeWidth: 1.5 };
  const body = {
    board: <>
      {[24, 66, 108].map(x => <Rect key={x} x={x} y={26} width={48} height={80} rx={12} {...panel} />)}
      <Rect x={31} y={38} width={34} height={13} rx={6} fill={c.elevated} /><Rect x={31} y={57} width={34} height={13} rx={6} fill={c.elevated} />
      <Rect x={73} y={38} width={34} height={13} rx={6} fill={c.accent} /><Rect x={73} y={57} width={34} height={13} rx={6} fill={c.elevated} />
      <Rect x={115} y={38} width={34} height={13} rx={6} fill={c.elevated} />
      <Circle cx={142} cy={96} r={14} fill={c.success} /><Path d="M136 96L140.5 100.5L148 91.5" fill="none" stroke={c.bg} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </>,
    timeline: <>
      <Rect x={22} y={24} width={136} height={84} rx={13} {...panel} />
      <Line x1={84} y1={32} x2={84} y2={100} stroke={c.faint} strokeWidth={1.5} strokeDasharray="3 4" />
      <Rect x={34} y={38} width={56} height={11} rx={5.5} fill={c.accent} />
      <Rect x={74} y={62} width={62} height={11} rx={5.5} fill={c.info} />
      <Rect x={46} y={86} width={44} height={11} rx={5.5} fill={c.success} />
      <Path d="M90 43.5H98V67.5H74" stroke={c.accentText} strokeWidth={1.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </>,
    release: <>
      <Rect x={30} y={22} width={120} height={88} rx={13} {...panel} />
      {[44, 66, 88].map((y, i) => <Rect key={y} x={58} y={y - 4} width={i === 2 ? 56 : 76} height={8} rx={4} fill={c.elevated} />)}
      {[44, 66].map(y => <Circle key={y} cx={43} cy={y} r={7} fill={c.success} />)}
      {[44, 66].map(y => <Path key={`k${y}`} d={`M39.5 ${y}L42 ${y + 2.5}L46.5 ${y - 3}`} fill="none" stroke={c.bg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />)}
      <Circle cx={43} cy={88} r={7} fill="none" stroke={c.accent} strokeWidth={2} />
    </>,
    sprint: <>
      <Rect x={22} y={24} width={136} height={84} rx={13} {...panel} />
      <Path d="M38 40V92H142" stroke={c.line} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M42 44L138 88" stroke={c.faint} strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
      <Path d="M42 44L64 52L88 66L110 70" stroke={c.info} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={110} cy={70} r={6} fill={c.accent} />
    </>,
    blank: <>
      <Rect x={38} y={26} width={104} height={80} rx={13} fill="none" stroke={c.line} strokeWidth={1.5} strokeDasharray="6 5" />
      <Line x1={90} y1={52} x2={90} y2={80} stroke={c.accent} strokeWidth={4} strokeLinecap="round" />
      <Line x1={76} y1={66} x2={104} y2={66} stroke={c.accent} strokeWidth={4} strokeLinecap="round" />
    </>,
  };
  return <Reveal duration={420} distance={10} style={{ width: size, height: size * 0.72 }}>
    <Svg accessible={false} width={size} height={size * 0.72} viewBox="0 0 180 130" {...{ pointerEvents: 'none' }}>
      <Circle cx={91} cy={67} r={54} fill={c.selection} />
      {body[kind] || body.board}
    </Svg>
  </Reveal>;
}
