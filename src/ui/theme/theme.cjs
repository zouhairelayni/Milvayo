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
// Contrast-based foreground for light or dark accents (WCAG relative luminance).
function contrastInk(hex){
 const [r,g,b]=hexToRgb(hex).map(v=>{const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;});
 const l=.2126*r+.7152*g+.0722*b;
 // Ink is #171514 (relative luminance ~0.0076); white is 1.
 return (l+.05)/.0576 >= 1.05/(l+.05) ? '#171514' : '#FFFFFF';
}
module.exports={DEFAULT_ACCENT,STORAGE_KEY,ACCENTS,findAccent,themeTokens,contrastInk};
