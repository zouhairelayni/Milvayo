// /src/ui/theme/theme.cjs
'use strict';
// Independent Niyarvo Projects theme preferences. RIVNA-inspired palette names;
// Niyarvo's own color values. No provider dependency or remote settings.
const DEFAULT_ACCENT = 'Orange';
const STORAGE_KEY = 'niyarvo-projects-accent-v1';
const ACCENTS = Object.freeze([
  {id:'Aqua',hex:'#2DD4BF'},
  {id:'Mint',hex:'#6EE7B7'},
  {id:'Lime',hex:'#D7F36A'},
  {id:'Amber',hex:'#FBBF24'},
  {id:'Orange',hex:'#D97757'},
  {id:'Coral',hex:'#FB8D80'},
  {id:'Pink',hex:'#F9A8D4'},
  {id:'Fuchsia',hex:'#E879F9'},
  {id:'Violet',hex:'#A78BFA'},
  {id:'Indigo',hex:'#818CF8'}
].map(Object.freeze));
function findAccent(id){return ACCENTS.find(a=>a.id===id)||ACCENTS.find(a=>a.id===DEFAULT_ACCENT)}
function hexToRgb(hex){const n=parseInt(hex.slice(1),16);return [(n>>16)&255,(n>>8)&255,n&255]}
function withAlpha(hex,alpha){const [r,g,b]=hexToRgb(hex);return `rgba(${r},${g},${b},${alpha})`}
function themeTokens(id){const color=findAccent(id);return {id:color.id,accent:color.hex,accentDim:withAlpha(color.hex,.16),accentBorder:withAlpha(color.hex,.52),accentText:'#101217'}}
module.exports={DEFAULT_ACCENT,STORAGE_KEY,ACCENTS,findAccent,themeTokens};
