// /src/components/charts/charts.js
import { useRef, useState } from 'react';
import { PanResponder, Platform, Pressable, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import TracePath from './TracePath';
import {useId} from 'react';
import { T } from '../../ui/ui';
import { useTheme } from '../../ui/theme/theme';

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
// Vertical swipes still scroll the page; horizontal drags belong to the chart (web).
const WEB_TOUCH = Platform.OS === 'web' ? { touchAction: 'pan-y' } : {};

// Both views use the same history: ideal/recorded lines or recorded bars with ideal ticks.
// Touch or drag across the chart to read any day; tap a legend item to hide or show that line.
export function BurnChart({ burn, height = 200 }) {
  const { c } = useTheme();
  const gradient=useId().replace(/[^a-z0-9]/gi,'');
  const [width, setWidth] = useState(320);
  const [sel, setSel] = useState(null); // selected day index; null means the latest day
  const [show, setShow] = useState({ ideal: true, recorded: true });
  const [chartType, setChartType] = useState('line');
  const padL = 36;
  const padR = 16;
  const padT = 16;
  const padB = 30;
  const n = burn.days.length;
  const max = Math.max(...burn.ideal, ...burn.recorded, 1);
  const slotWidth = Math.max(1, width - padL - padR) / n;
  const barWidth = Math.max(1, Math.min(32, slotWidth - 4));
  const x = (i) => chartType === 'bar' ? padL + (i + 0.5) * slotWidth : padL + (n === 1 ? 0 : (i * (width - padL - padR)) / (n - 1));
  const y = (v) => padT + (1 - v / max) * (height - padT - padB);
  const line = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ');
  const ticks = [...new Set([0, Math.round(max / 2), max])]; // max=1 rounds the midpoint to 1, which would repeat a key

  const i = sel === null ? n - 1 : clamp(sel, 0, n - 1);
  const ideal = burn.ideal[i];
  const rec = burn.recorded[i];
  const gap = rec - ideal;

  // The pan responder is made once, so it reads the width and day count through a ref.
  const geo = useRef({});
  geo.current = { width, padL, padR, n, chartType };
  const pick = (px) => {
    const g = geo.current;
    const span = g.width - g.padL - g.padR;
    if (g.n <= 1 || span <= 0) return setSel(0);
    const day = g.chartType === 'bar' ? Math.floor(((px - g.padL) / span) * g.n) : Math.round(((px - g.padL) / span) * (g.n - 1));
    setSel(clamp(day, 0, g.n - 1));
  };
  const tapStart = useRef(null);
  const pan = useRef(
    PanResponder.create({
      // Don't seize a vertical scroll on touch-down: claim only clear horizontal chart drags.
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (e, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
      onPanResponderTerminationRequest: () => true,
      onPanResponderGrant: (e) => pick(e.nativeEvent.locationX),
      onPanResponderMove: (e) => pick(e.nativeEvent.locationX),
    })
  ).current;

  if (!n) return <T muted>No recorded sprint history yet.</T>;
  const toggle = (key) => setShow((p) => (p[key] && !(key === 'ideal' ? p.recorded : p.ideal) ? p : { ...p, [key]: !p[key] }));

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ width: '100%', gap: 12 }}>
      <View accessibilityLabel="Burndown chart view" style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 4 }}>
        {['line', 'bar'].map(type => <Pressable key={type} accessibilityRole="button" accessibilityLabel={type === 'line' ? 'Line graph' : 'Bar graph'} accessibilityState={{ selected: chartType === type }} onPress={() => setChartType(type)}
          style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: chartType === type || pressed ? c.surfaceAlt : 'transparent' })}>
          <Svg width={20} height={20} viewBox="0 0 20 20" pointerEvents="none">
            {type === 'line' ? <Path d="M3 3v14h14 M5 12l4-5 4 3 4-6" stroke={chartType === type ? c.ink : c.muted} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              : <><Rect x={4} y={5} width={3} height={12} rx={1} fill={chartType === type ? c.ink : c.muted} /><Rect x={9} y={9} width={3} height={8} rx={1} fill={chartType === type ? c.ink : c.muted} /><Rect x={14} y={12} width={3} height={5} rx={1} fill={chartType === type ? c.ink : c.muted} /></>}
          </Svg>
        </Pressable>)}
      </View>
      <View {...pan.panHandlers}
        onTouchStart={e=>{const t=e.nativeEvent.touches?.[0];tapStart.current=t?{x:t.pageX,y:t.pageY}:null;}}
        onTouchEnd={e=>{const t=e.nativeEvent.changedTouches?.[0],a=tapStart.current;tapStart.current=null;
          if(t&&a&&Math.abs(t.pageX-a.x)<8&&Math.abs(t.pageY-a.y)<8&&Number.isFinite(e.nativeEvent.locationX))pick(e.nativeEvent.locationX);}}
        style={[{ width: '100%', height }, WEB_TOUCH]}>
        <Svg width={width} height={height} pointerEvents="none">
          <Defs><LinearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={c.accent} stopOpacity={.2}/><Stop offset="1" stopColor={c.accent} stopOpacity={0}/></LinearGradient></Defs>
          {ticks.map((tv) => (
            <Line key={'g' + tv} x1={padL} x2={width - padR} y1={y(tv)} y2={y(tv)} stroke={c.line} strokeWidth={1} />
          ))}
          {ticks.map((tv) => (
            <SvgText key={'t' + tv} x={padL - 8} y={y(tv) + 4} fill={c.muted} fontSize={11} textAnchor="end">
              {tv}
            </SvgText>
          ))}
          {burn.days.map((d, di) => di===0||di===n-1||di%Math.max(1,Math.ceil(n/5))===0 ? (
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
          ) : null)}

          {/* Guide for the selected day */}
          <Line x1={x(i)} x2={x(i)} y1={padT} y2={height - padB} stroke={c.faint} strokeWidth={1.5} />

          {chartType === 'bar' ? <>
            {show.recorded ? burn.recorded.map((v, di) => <Rect key={'bar' + di} x={x(di) - barWidth / 2} y={Math.min(y(v), height - padB - 2)} width={barWidth} height={Math.max(2, height - padB - y(v))} rx={Math.min(4, barWidth / 2)} fill={di === i ? c.accent : c.muted} fillOpacity={di === i ? 1 : 0.4} />) : null}
            {show.ideal ? burn.ideal.map((v, di) => <Line key={'ideal' + di} x1={x(di) - barWidth / 2} x2={x(di) + barWidth / 2} y1={y(v)} y2={y(v)} stroke={c.ink} strokeOpacity={0.55} strokeWidth={2} />) : null}
          </> : <>
          {show.ideal ? <Path d={line(burn.ideal)} stroke={c.muted} strokeWidth={2} strokeDasharray="6,5" fill="none" /> : null}
          {show.recorded ? <><Path d={`${line(burn.recorded)} L${x(n-1)},${height-padB} L${x(0)},${height-padB} Z`} fill={`url(#${gradient})`}/><TracePath d={line(burn.recorded)} length={(width+height)*2} stroke={c.accent} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round"/></> : null}
          {show.recorded
            ? burn.recorded.map((v, di) => (
                <Circle key={'d' + di} cx={x(di)} cy={y(v)} r={di === i ? 7 : 4.5} fill={c.accent} stroke={c.surface} strokeWidth={2} />
              ))
            : null}
          {show.ideal ? <Circle cx={x(i)} cy={y(ideal)} r={5.5} fill={c.surface} stroke={c.muted} strokeWidth={2.5} /> : null}
          </>}
        </Svg>
      </View>

      {/* Reading for the selected day */}
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 14, padding: 12, borderRadius: 12, backgroundColor: c.surfaceAlt }}>
        <T size={13} weight="700">{burn.days[i]}</T>
        <T size={13} muted>Ideal <T size={13} weight="600">{ideal}</T></T>
        <T size={13} muted>Recorded <T size={13} weight="600" color={c.accentText}>{rec}</T></T>
        <T size={13} weight="600" color={gap > 0 ? c.accentText : c.ink}>
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
      accessibilityRole="checkbox"
      accessibilityState={{checked:!!on}}
      accessibilityLabel={`${label} series`}
      hitSlop={12}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
    >
      <View style={{ width: 22, height: 0, borderTopWidth: dashed ? 2 : 3, borderStyle: dashed ? 'dashed' : 'solid', borderColor: color }} />
      <T size={12} muted style={{textDecorationLine:on?'none':'line-through'}}>{label}</T>
    </Pressable>
  );
}
