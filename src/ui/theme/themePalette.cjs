// /src/ui/theme/themePalette.cjs
'use strict';
// Niyarvo Projects preference IDs are unchanged; visual values mirror the supplied RIVNA palette.
const DEFAULT_ACCENT = 'Orange';
const STORAGE_KEY = 'niyarvo-projects-accent-v1';
const ACCENTS = Object.freeze([
  ['Aqua', '#5B9CF8', '#2563EB', '#5B9CF8', '#2563EB', '#0F1316', '#181D21', '#ECF1F5'],
  ['Mint', '#5FB8B1', '#008080', '#5FB8B1', '#008080', '#101614', '#18201E', '#EAF3EF'],
  ['Lime', '#D7F36A', '#A3E635', '#D7F36A', '#4D7C0F', '#10120F', '#191C17', '#EEF2EA'],
  ['Amber', '#FBBF24', '#FFA500', '#FBBF24', '#FFA500', '#16140E', '#201E17', '#F3F0EA'],
  ['Orange', '#FF6F61', '#E65A19', '#FF6F61', '#E65A19', '#16120F', '#201C18', '#F5F0EA'],
  ['Coral', '#FB7185', '#E11D48', '#FB7185', '#E11D48', '#161112', '#201B1C', '#F5EDED'],
  ['Pink', '#F472B6', '#DB2777', '#F472B6', '#DB2777', '#151114', '#1F1B1E', '#F5EEF0'],
  ['Fuchsia', '#E879F9', '#C026D3', '#E879F9', '#C026D3', '#151116', '#1F1B21', '#F3EEF4'],
  ['Violet', '#A78BFA', '#7C3AED', '#A78BFA', '#7C3AED', '#121216', '#1B1C21', '#F0EEF6'],
  ['Indigo', '#818CF8', '#4F46E5', '#818CF8', '#4F46E5', '#111216', '#191C21', '#EEEFF5'],
].map(([id, start, end, darkPrimary, lightPrimary, darkBackground, darkCard, lightBackground]) => Object.freeze({
  id, hex: start, start, end, darkPrimary, lightPrimary, darkBackground, darkCard, lightBackground,
})));
function findAccent(id) { return ACCENTS.find(a => a.id === id) || ACCENTS.find(a => a.id === DEFAULT_ACCENT); }
function hexToRgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function withAlpha(hex, alpha) { const [r,g,b] = hexToRgb(hex); return `rgba(${r},${g},${b},${alpha})`; }
function linear(v) { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }
function luminance(hex) { const [r,g,b] = hexToRgb(hex); return .2126*linear(r)+.7152*linear(g)+.0722*linear(b); }
function contrast(a,b) { const x=luminance(a), y=luminance(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); }
function buttonInk(accent) { return contrast('#FFFFFF',accent) >= contrast('#111317',accent) ? '#FFFFFF' : '#111317'; }
// Buttons retain the exact chosen accent. Small text uses its nearest high-contrast shade.
function readableAccent(accent, background, dark) {
  if (contrast(accent, background) >= 4.5) return accent;
  const from = hexToRgb(accent), toward = dark ? 255 : 0;
  for (let step = 1; step <= 100; step++) {
    const share = step / 100;
    const channels = from.map(v => Math.round(v * (1 - share) + toward * share));
    const candidate = '#' + channels.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
    if (contrast(candidate, background) >= 4.5) return candidate;
  }
  return dark ? '#FFFFFF' : '#000000';
}
function scale(hex, amount) { return '#' + hexToRgb(hex).map(n => Math.round(n * amount).toString(16).padStart(2, '0')).join('').toUpperCase(); }
function palette(id, mode) {
  const a = findAccent(id);
  const dark = mode === 'dark' || mode === 'amoled';
  const amoled = mode === 'amoled';
  // AMOLED keeps the canvas black while giving controls and cards enough separation to use.
  const accent = amoled ? scale(a.darkPrimary, 0.86) : dark ? a.darkPrimary : a.lightPrimary;
  return {
    mode, bg: amoled ? '#000000' : dark ? a.darkBackground : a.lightBackground,
    surface: amoled ? scale(a.darkCard, 0.50) : dark ? a.darkCard : '#FFFFFF',
    surfaceAlt: amoled ? scale(a.darkBackground, 0.35) : dark ? a.darkBackground : a.lightBackground,
    ink: dark ? '#F4F3F2' : '#17191B', muted: dark ? '#AEB3B5' : '#586169',
    faint: dark ? '#7E8589' : '#656D75', line: amoled ? '#33383A' : dark ? '#383A3C' : '#D6D9DB',
    accent, accentText: readableAccent(accent, mode === 'amoled' ? '#000000' : dark ? a.darkBackground : a.lightBackground, dark),
    accentInk: buttonInk(accent),
  };
}
function themeTokens(id) {
  const a = findAccent(id);
  return {id:a.id, accent:a.hex, accentDim:withAlpha(a.hex,.16), accentBorder:withAlpha(a.hex,.52), accentText:buttonInk(a.hex)};
}
module.exports={DEFAULT_ACCENT, STORAGE_KEY, ACCENTS, findAccent, themeTokens, palette, contrast, buttonInk};
