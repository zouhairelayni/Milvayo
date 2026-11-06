// /src/ui/theme/themePalette.cjs
'use strict';
// Milvayo preference IDs are unchanged; semantic values follow the reviewed designexamples palettes.
const DEFAULT_ACCENT = 'Coral';
const STORAGE_KEY = 'milvayo-accent-v1';
// Designed semantic derivatives of the supplied designexamples palette sheets; preference IDs stay stable.
const ACCENTS = Object.freeze([
  ['Aqua','#65A7C2','#216A85','#65A7C2','#216A85','#071D24','#0D2B36','#EFF7FA'],
  ['Mint','#43C495','#159C6B','#43C495','#0F6B4A','#061D17','#0C2C22','#F0F8F4'],
  ['Lime','#A5D766','#466A22','#A5D766','#466A22','#13240F','#203417','#F4F8ED'],
  ['Amber','#E8BB4A','#CC961F','#E8BB4A','#8A6414','#211C11','#302B1B','#FCF8EC'],
  ['Orange','#FCA311','#B5670A','#FCA311','#B5670A','#111927','#1B293B','#F9F5ED'],
  ['Coral','#E98B7E','#BA463E','#E98B7E','#BA463E','#18252D','#26343C','#FCF4F0'],
  ['Pink','#ED8FAC','#A7275C','#ED8FAC','#A7275C','#27131F','#3B2232','#FFF3F6'],
  ['Fuchsia','#D5A1DA','#954BA3','#D5A1DA','#954BA3','#1E0E27','#331B3E','#FAF2FC'],
  ['Violet','#BB74E2','#7730A0','#BB74E2','#7730A0','#1B1127','#2B1E3C','#F8F2FC'],
  ['Indigo','#AFB4CE','#4F5580','#AFB4CE','#4F5580','#12141F','#232739','#F3F4F9'],
].map(([id,start,end,darkPrimary,lightPrimary,darkBackground,darkCard,lightBackground])=>Object.freeze({
 id,hex:start,start,end,darkPrimary,lightPrimary,darkBackground,darkCard,lightBackground,
})));

function findAccent(id) { return ACCENTS.find(a => a.id === id) || ACCENTS.find(a => a.id === DEFAULT_ACCENT); }
function hexToRgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function withAlpha(hex, alpha) { const [r,g,b] = hexToRgb(hex); return `rgba(${r},${g},${b},${alpha})`; }
function linear(v) { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }
function luminance(hex) { const [r,g,b] = hexToRgb(hex); return .2126*linear(r)+.7152*linear(g)+.0722*linear(b); }
function contrast(a,b) { const x=luminance(a), y=luminance(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); }
function buttonInk(accent) {
  if(contrast('#FFFFFF',accent)>=4.5)return '#FFFFFF';
  return contrast('#111317',accent)>=4.5?'#111317':'#000000';
}
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
function mix(a,b,share){const x=hexToRgb(a),y=hexToRgb(b);return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*share).toString(16).padStart(2,'0')).join('').toUpperCase();}
function palette(id, mode) {
  const a=findAccent(id),dark=mode==='dark'||mode==='amoled',amoled=mode==='amoled';
  const bg=amoled?'#000000':dark?'#0C0D0F':'#F4F5F7';
  const surface=amoled?'#101113':dark?'#17191C':'#FFFFFF';
  const elevated=dark?'#202226':'#F0F1F4';
  const accent=dark?a.darkPrimary:a.lightPrimary;
  const selection=dark?'#2C2F34':'#E6E8ED';
  return {
    mode,bg,surface,elevated,surfaceAlt:dark?'#121416':'#ECEEF2',
    ink:dark?'#F2F4F7':'#172331',muted:readableAccent(dark?'#B4BAC6':'#566474',dark?elevated:'#ECEEF2',dark),
    faint:readableAccent(dark?'#949FAE':'#687486',dark?elevated:'#ECEEF2',dark),
    line:dark?mix(surface,'#FFFFFF',.16):mix(surface,'#172331',.16),
    accent,accentText:readableAccent(accent,bg,dark),accentInk:buttonInk(accent),
    selection,onSelection:readableAccent(accent,selection,dark),
    success:dark?'#83D8B4':'#16734C',warning:dark?'#F0CC77':'#8C5C0D',danger:dark?'#FFA09B':'#B6303C',info:dark?'#8FC6ED':'#25638E',
    dock:dark?elevated:'#FFFFFF',
  };
}

function themeTokens(id) {
  const a = findAccent(id);
  return {id:a.id, accent:a.hex, accentDim:withAlpha(a.hex,.16), accentBorder:withAlpha(a.hex,.52), accentText:buttonInk(a.hex)};
}
module.exports={DEFAULT_ACCENT, STORAGE_KEY, ACCENTS, findAccent, themeTokens, palette, contrast, buttonInk};
