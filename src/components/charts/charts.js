// /src/components/charts/charts.js
import { useRef, useState } from 'react';
import { PanResponder, Platform, Pressable, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { T } from '../../ui/ui';
import { useTheme } from '../../ui/theme/theme';

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
// Vertical swipes still scroll the page; horizontal drags belong to the chart (web).
const WEB_TOUCH = Platform.OS === 'web' ? { touchAction: 'pan-y' } : {};

// Burndown as two lines: dashed ideal and solid recorded.
// Touch or drag across the chart to read any day; tap a legend item to hide or show that line.
export function BurnChart({ burn, height = 200 }) {
  const { c } = useTheme();
  const [width, setWidth] = useState(320);
  const [sel, setSel] = useState(null); // selected day index; null means the latest day
  const [show, setShow] = useState({ ideal: true, recorded: true });
  const padL = 36;
  const padR = 16;
  const padT = 16;
  const padB = 30;
  const n = burn.days.length;
  const max = Math.max(...burn.ideal, ...burn.recorded, 1);
  const x = (i) => padL + (n === 1 ? 0 : (i * (width - padL - padR)) / (n - 1));
  const y = (v) => padT + (1 - v / max) * (height - padT - padB);
  const line = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ');
  const ticks = [...new Set([0, Math.round(max / 2), max])]; // max=1 rounds the midpoint to 1, which would repeat a key

  const i = sel === null ? n - 1 : clamp(sel, 0, n - 1);
  const ideal = burn.ideal[i];
  const rec = burn.recorded[i];
  const gap = rec - ideal;

  // The pan responder is made once, so it reads the width and day count through a ref.
  const geo = useRef({});
  geo.current = { width, padL, padR, n };
  const pick = (px) => {
    const g = geo.current;
    const span = g.width - g.padL - g.padR;
    if (g.n <= 1 || span <= 0) return setSel(0);
    setSel(clamp(Math.round(((px - g.padL) / span) * (g.n - 1)), 0, g.n - 1));
  };
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (e, g) => Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderTerminationRequest: () => true,
      onPanResponderGrant: (e) => pick(e.nativeEvent.locationX),
      onPanResponderMove: (e) => pick(e.nativeEvent.locationX),
    })
  ).current;

  const toggle = (key) => setShow((p) => (p[key] && !(key === 'ideal' ? p.recorded : p.ideal) ? p : { ...p, [key]: !p[key] }));

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ width: '100%', gap: 12 }}>
      <View {...pan.panHandlers} style={[{ width: '100%', height }, WEB_TOUCH]}>
        <Svg width={width} height={height} pointerEvents="none">
          {ticks.map((tv) => (
            <Line key={'g' + tv} x1={padL} x2={width - padR} y1={y(tv)} y2={y(tv)} stroke={c.line} strokeWidth={1} />
          ))}
          {ticks.map((tv) => (
            <SvgText key={'t' + tv} x={padL - 8} y={y(tv) + 4} fill={c.muted} fontSize={11} textAnchor="end">
              {tv}
            </SvgText>
          ))}
          {burn.days.map((d, di) => (
            <SvgText
              key={d}
              x={x(di)}
              y={height - 8}
              fill={di === i ? c.ink : c.muted}
              fontSize={11}
              fontWeight={di === i ? '700' : '400'}
              textAnchor="middle"
            >
              {d}
            </SvgText>
          ))}

          {/* Guide for the selected day */}
          <Line x1={x(i)} x2={x(i)} y1={padT} y2={height - padB} stroke={c.faint} strokeWidth={1.5} />

          {show.ideal ? <Path d={line(burn.ideal)} stroke={c.muted} strokeWidth={2} strokeDasharray="6,5" fill="none" /> : null}
          {show.recorded ? <Path d={line(burn.recorded)} stroke={c.accent} strokeWidth={3} fill="none" strokeLinejoin="round" /> : null}
          {show.recorded
            ? burn.recorded.map((v, di) => (
                <Circle key={'d' + di} cx={x(di)} cy={y(v)} r={di === i ? 7 : 4.5} fill={c.accent} stroke={c.surface} strokeWidth={2} />
              ))
            : null}
          {show.ideal ? <Circle cx={x(i)} cy={y(ideal)} r={5.5} fill={c.surface} stroke={c.muted} strokeWidth={2.5} /> : null}
        </Svg>
      </View>

      {/* Reading for the selected day */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 14, padding: 12, borderRadius: 12, backgroundColor: c.surfaceAlt }}>
        <T size={13} weight="700">{burn.days[i]}</T>
        <T size={13} muted>Ideal <T size={13} weight="600">{ideal}</T></T>
        <T size={13} muted>Recorded <T size={13} weight="600" color={c.accent}>{rec}</T></T>
        <T size={13} weight="600" color={gap > 0 ? c.accent : c.ink}>
          {gap > 0 ? `${gap} behind ideal` : gap < 0 ? `${-gap} ahead of ideal` : 'On the ideal line'}
        </T>
      </View>

      <View style={{ flexDirection: 'row', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <Legend color={c.muted} label="Ideal" dashed on={show.ideal} onPress={() => toggle('ideal')} />
        <Legend color={c.accent} label="Recorded" on={show.recorded} onPress={() => toggle('recorded')} />
        <T size={11} muted>Touch or drag the chart to read a day</T>
      </View>
    </View>
  );
}

function Legend({ color, label, dashed, on, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`${on ? 'Hide' : 'Show'} ${label}`}
      hitSlop={8}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, opacity: on ? 1 : 0.4 }}
    >
      <View style={{ width: 22, height: 0, borderTopWidth: dashed ? 2 : 3, borderStyle: dashed ? 'dashed' : 'solid', borderColor: color }} />
      <T size={12} muted>{label}</T>
    </Pressable>
  );
}
