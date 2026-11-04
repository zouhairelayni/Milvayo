// /src/ui/theme/design.cjs
'use strict';
// Niyarvo Projects | shared visual system, Unslop review 2026-10-30
// Quiet graphite chrome. Violet marks interactive focus; task statuses own content color.
const colors={
 bg:'#161719',side:'#121315',panel:'#1e2023',panel2:'#282a2e',raised:'#32353a',
 border:'#34363b',border2:'#4b4e55',line:'#34363b',
 ink:'#f1f0ed',muted:'#a4a6ac',sub:'#c7c8cd',white:'#ffffff',
 purple:'#FF6F61',purpleDim:'rgba(255,111,97,0.16)',accent:'#FF6F61',accentBorder:'rgba(255,111,97,0.52)',green:'#8ccdaa',amber:'#eac07b',red:'#e795a0',cyan:'#91c8d8'
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
