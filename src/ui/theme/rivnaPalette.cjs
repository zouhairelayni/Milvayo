// /src/ui/theme/rivnaPalette.cjs
'use strict';
// Niyarvo Projects preference IDs are unchanged; visual values mirror the supplied RIVNA palette.
const DEFAULT_ACCENT = 'Orange';
const STORAGE_KEY = 'niyarvo-projects-accent-v1';
const ACCENTS = Object.freeze([
  ['Aqua', '#2DD4BF', '#3B82F6', '#5B9CF8', '#2563EB', '#0F1316', '#181D21', '#ECF1F5'],
  ['Mint', '#6EE7B7', '#10B981', '#6EE7B7', '#059669', '#101614', '#18201E', '#EAF3EF'],
  ['Lime', '#D7F36A', '#A3E635', '#D7F36A', '#4D7C0F', '#10120F', '#191C17', '#EEF2EA'],
  ['Amber', '#FBBF24', '#D97706', '#FBBF24', '#B45309', '#16140E', '#201E17', '#F3F0EA'],
  ['Orange', '#FB923C', '#EA580C', '#FB923C', '#EA580C', '#16120F', '#201C18', '#F5F0EA'],
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
function palette(id, mode) {
  const a = findAccent(id);
  const dark = mode === 'dark' || mode === 'amoled';
  const accent = dark ? a.darkPrimary : a.lightPrimary;
  return {
    mode, bg: mode === 'amoled' ? '#000000' : dark ? a.darkBackground : a.lightBackground,
    surface: dark ? a.darkCard : '#FFFFFF',
    surfaceAlt: dark ? a.darkBackground : a.lightBackground,
    ink: dark ? '#F4F3F2' : '#17191B', muted: dark ? '#AEB3B5' : '#586169',
    faint: dark ? '#7E8589' : '#858E95', line: dark ? '#383A3C' : '#D6D9DB',
    accent, accentInk: buttonInk(accent),
  };
}
function themeTokens(id) {
  const a = findAccent(id);
  return {id:a.id, accent:a.hex, accentDim:withAlpha(a.hex,.16), accentBorder:withAlpha(a.hex,.52), accentText:buttonInk(a.hex)};
}
module.exports={DEFAULT_ACCENT, STORAGE_KEY, ACCENTS, findAccent, themeTokens, palette, contrast, buttonInk};
