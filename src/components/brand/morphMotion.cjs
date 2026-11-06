// /src/components/brand/morphMotion.cjs
'use strict';
const { routes, outlines, windows, windowSamples } = require('./morphGeometry.cjs');
const DURATION = 3700;
const clamp = value => { 'worklet'; return Math.min(1, Math.max(0, value)); };
const fade = (from, to, t) => { 'worklet'; return clamp((t - from) / (to - from)); };
const easeOut = t => { 'worklet'; return 1 - (1 - t) ** 3; };
// The original preview's precise cubic-bezier(.77,0,.175,1), solved for time.
function easeInOut(t) {
  'worklet';
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const cx = 2.31, bx = 3 * (.175 - .77) - cx, ax = 1 - cx - bx;
  let lo = 0, hi = 1, u = t;
  for (let i = 0; i < 24; i++) {
    const x = ((ax * u + bx) * u + cx) * u;
    if (Math.abs(x - t) < 1e-5) break;
    if (x < t) lo = u; else hi = u;
    u = (lo + hi) / 2;
  }
  return (-2 * u + 3) * u * u;
}
function outlinePath(i, t, continuous = false) {
  'worklet';
  const r = routes[i];
  const phase = fade(.015 + i * .025, .70 + i * .025, clamp(t));
  // Cold playback starts moving immediately with an exact smoothstep. Keep the
  // approved longer preview timing unchanged for every other caller.
  const p = continuous ? phase * phase * (3 - 2 * phase) : easeInOut(fade([.16, .20, .24][i], [.72, .76, .80][i], clamp(t)));
  if (p >= 1) return outlines[i];
  return 'M' + r.from.map(([x,y],j) => {
    const [tx,ty] = r.to[j];
    return (x+(tx-x)*p).toFixed(2)+' '+(y+(ty-y)*p).toFixed(2);
  }).join(' L') + ' Z';
}
// Window timing, 3–2–1 across columns. No whole-logo opacity changes.
function windowProgress(index, t, continuous = false) {
  'worklet';
  const start = continuous ? .72 + index * .04 : .81 + index * .03;
  return easeOut(fade(start, start + (continuous ? .08 : .027), clamp(t)));
}
function ribbonPath(i, t, continuous = false) {
  'worklet';
  const base = outlinePath(i, t, continuous);
  if (t < (continuous ? .72 : .81)) return base;
  let compound = base;
  let start = 0;
  for (let col=0; col < i; col++) start += windows[col].length;
  for (let j=0; j<windows[i].length; j++) {
    const p = windowProgress(start + j,t,continuous);
    if (p <= 0) continue;
    if (p >= 1) { compound += ' ' + windows[i][j]; continue; }
    // Scale an accurately pre-sampled window around its original centre.
    const dots = windowSamples[i][j];
    const cx = dots.reduce((v, a) => v+a[0],0)/dots.length;
    const cy = dots.reduce((v, a) => v+a[1],0)/dots.length;
    compound += ' M' + dots.map(([x,y]) =>
      (cx+(x-cx)*p).toFixed(2)+' '+(cy+(y-cy)*p).toFixed(2)).join(' L')+' Z';
  }
  return compound;
}
module.exports = { DURATION, ribbonPath, outlinePath, windowProgress, easeInOut, clamp, windows };
