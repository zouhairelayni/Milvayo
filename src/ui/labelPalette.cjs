// /src/ui/labelPalette.cjs
// Shared project-label palette. Colors are stored by label name, never by task ID.
'use strict';
const COLORS=Object.freeze(['#B42318','#DC2626','#F97316','#D97706','#FACC15','#84CC16','#16A34A','#059669','#0D9488','#0891B2','#0284C7','#2563EB','#4F46E5','#7C3AED','#9333EA','#C026D3','#DB2777','#E11D48','#64748B','#475569','#334155','#A16207','#15803D','#1D4ED8']);
const validColor=x=>typeof x==='string' && /^#[0-9a-fA-F]{6}$/.test(x);
const normalizeLabelColors=raw=>{const out={};if(!raw||typeof raw!=='object'||Array.isArray(raw))return out;for(const [k,v] of Object.entries(raw).slice(0,200)){if(k&&k.length<=40&&validColor(v))out[k]=v.toUpperCase();}return out;};
const defaultColor=name=>{let h=0;for(const ch of String(name||''))h=(h*31+ch.charCodeAt(0))>>>0;return COLORS[h%COLORS.length];};
const labelColor=(name,map)=>validColor(map?.[name])?map[name]:defaultColor(name);
const textColor=hex=>{const v=String(hex).replace('#','');if(!/^[0-9a-f]{6}$/i.test(v))return '#FFFFFF';const rgb=[0,2,4].map(i=>parseInt(v.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722>.43?'#17202B':'#FFFFFF';};
module.exports={COLORS,validColor,normalizeLabelColors,defaultColor,labelColor,textColor};
