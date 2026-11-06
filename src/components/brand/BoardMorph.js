// /src/components/brand/BoardMorph.js
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import Svg, { Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { useTheme } from '../../ui/theme/theme';
const data = require('./morphGeometry.cjs');
const { DURATION, ribbonPath, windowProgress } = require('./morphMotion.cjs');


// Approved three-ribbon no-flicker morph. Even-odd board cutouts avoid platform-sensitive SVG masks.
export default function BoardMorph({ size = 42, speed = 1, duration = DURATION, continuous = false, active = false, solid = false, onStart, onFinish }) {
  const { accentPref, c } = useTheme();
  const ramps = data.palettes[accentPref] || data.palettes.Orange;
  const id = useId().replace(/[^A-Za-z0-9_-]/g, '');
  const [progress, setProgress] = useState(active ? 0 : 1);
  const done = useRef(onFinish);
  const began = useRef(onStart);
  done.current = onFinish;
  began.current = onStart;
  useEffect(() => {
    if (!active) { setProgress(1); return undefined; }
    let cancelled = false, frame = null, start = null, last = null, frames = 0, maxGap = 0;
    const playback=(Number.isFinite(duration)&&duration>0?duration:DURATION)/(Number.isFinite(speed)&&speed>0?speed:1);
    setProgress(0);
    const finish = elapsed => { if (!cancelled) { setProgress(1); done.current?.({frames,maxGap,elapsed}); } };
    const tick = stamp => {
      if (cancelled) return;
      if (start === null) { start = stamp; began.current?.(); }
      frames++; if(last!==null)maxGap=Math.max(maxGap,stamp-last);last=stamp;
      const p = Math.min(1, (stamp - start) / playback);
      setProgress(p);
      if (p >= 1) frame = requestAnimationFrame(()=>finish(stamp-start)); else frame = requestAnimationFrame(tick);
    };
    const reduce = Platform.OS === 'web' && typeof window !== 'undefined'
      ? Promise.resolve(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false)
      : AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
    reduce.then(enabled => { if (cancelled) return; if (enabled) { began.current?.(); setProgress(1); frame=requestAnimationFrame(()=>finish(0)); } else frame = requestAnimationFrame(tick); });
    return () => { cancelled = true; if (frame !== null) cancelAnimationFrame(frame); };
  }, [active, speed, duration]);
  const shapes = useMemo(() => [0,1,2].map(i => ribbonPath(i,progress,continuous)), [progress,continuous]);
  return <Svg width={size} height={size} viewBox="0 0 256 256" {...(Platform.OS === 'web' ? { role: 'img', 'aria-label': 'Milvayo Board logo' } : { accessible: true, accessibilityLabel: 'Milvayo Board logo' })}>
    <Defs>
      {ramps.map(([light, dark], i) => <LinearGradient key={'g'+i} id={`${id}-gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor={light}/><Stop offset="1" stopColor={dark}/>
      </LinearGradient>)}
    </Defs>
    <G>
      {/* Keep the middle diagonal above the right ribbon, matching the approved preview's layering. */}
      {[0,2,1].map(i => <Path key={i} d={shapes[i]} fill={solid ? c.accent : `url(#${id}-gradient-${i})`} fillRule="evenodd" />)}
    </G>
  </Svg>;
}
