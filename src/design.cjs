'use strict';
// Niyarvo Projects | shared visual system, Unslop review 2026-10-30
// Quiet graphite chrome. Violet marks interactive focus; task statuses own content color.
const colors={
 bg:'#101217',side:'#161920',panel:'#1c2028',panel2:'#242832',raised:'#2c303b',
 border:'#353943',border2:'#424650',line:'#343943',
 ink:'#f3f2f6',muted:'#a8a9b6',sub:'#c2c1ca',white:'#ffffff',
 purple:'#D97757',purpleDim:'rgba(217,119,87,0.16)',accent:'#D97757',accentBorder:'rgba(217,119,87,0.52)',green:'#8ccdaa',amber:'#eac07b',red:'#e795a0',cyan:'#91c8d8'
};
const space={xs:4,sm:8,md:12,base:16,lg:24,xl:32};
const radius={control:8,card:10,panel:12};
const hit={control:44,icon:44};
module.exports={colors,space,radius,hit};

// Keep the legacy `purple` token as a backwards-compatible alias, not a hardcoded violet.
const theme=require('./theme.cjs');
function setAccent(id){
 const tokens=theme.themeTokens(id);
 colors.purple=colors.accent=tokens.accent;
 colors.purpleDim=colors.accentDim=tokens.accentDim;
 colors.accentBorder=tokens.accentBorder;
 return tokens.id;
}
setAccent(theme.DEFAULT_ACCENT);
module.exports.setAccent=setAccent;
module.exports.theme=theme;
