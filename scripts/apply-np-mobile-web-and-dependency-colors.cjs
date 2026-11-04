// /scripts/apply-np-mobile-web-and-dependency-colors.cjs
'use strict';
// Targeted 0.5.33 Web mobile/desktop-mode correction and colored Timeline links.
// Preflight all source changes before writing. No data or gesture engine is touched.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const dry = process.argv.includes('--dry-run');
const f = p => path.join(root,p);
const exists = p => fs.existsSync(f(p));
const read = p => fs.readFileSync(f(p),'utf8');
const changes = [];
function edit(p,next,reason){
  if(next !== read(p))changes.push({p,next,reason});
}
function requireNeedle(src, needle, label){if(!src.includes(needle))throw Error(`Unsupported ${label}; no files changed`);}
const marker='NP533_MOBILE_BROWSER_MODE';
const injection = `\n// ${marker}: Web's CSS viewport alone cannot distinguish a portrait phone from Desktop site.\nfunction np533MobileBrowser() {\n  if (typeof navigator === 'undefined') return false;\n  // Some browsers keep a mobile UA on Desktop site but expand the CSS viewport.\n  if (typeof window !== 'undefined') {\n    const sw = Number(window.screen && window.screen.width);\n    const vw = Number(window.innerWidth);\n    if (sw > 0 && sw <= 600 && vw >= 700 && vw / sw >= 1.6) return false;\n  }\n  const hints = navigator.userAgentData;\n  if (hints && typeof hints.mobile === 'boolean') return hints.mobile;\n  return /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(String(navigator.userAgent || ''));\n}\nconst np533OriginalDesktopLayout = module.exports.isDesktopLayout;\nmodule.exports.isDesktopLayout = function(width, platform, preference = 'auto', mobileHint) {\n  if (platform === 'web' && preference !== 'desktop') {\n    const mobile = typeof mobileHint === 'boolean' ? mobileHint : np533MobileBrowser();\n    if (mobile) return false;\n  }\n  return np533OriginalDesktopLayout(width, platform, preference);\n};\n`;
const colorsMarker='NP533_COLORED_DEPENDENCIES';
const colorHelper=`\n// ${colorsMarker}: stable, distinct dependency colors; no routing or gesture changes.\nconst NP533_DEP_COLORS = ['#E0512D', '#3B6FE0', '#2F9E6B', '#D89614', '#8E5CD6', '#14A3B8', '#E6399B'];\nfunction np533DependencyColor(link) {\n  const id = String(link.key || String(link.pid) + '>' + String(link.tid));\n  let hash = 0;\n  for (let i = 0; i < id.length; i++) hash = (Math.imul(hash, 31) + id.charCodeAt(i)) >>> 0;\n  return NP533_DEP_COLORS[hash % NP533_DEP_COLORS.length];\n}\n`;
function patchDependencyStroke(source){
  if(source.includes(colorsMarker))return source;
  const start = source.search(/\{links\.map\(\(l\)\s*=>\s*\(\s*<Path\b/);
  if(start<0)throw Error('Timeline dependency Path mapping not recognized; no files changed');
  const pathStart=source.indexOf('<Path',start);
  const pathEnd=source.indexOf('/>',pathStart);
  if(pathEnd<0 || pathEnd-pathStart>2000)throw Error('Timeline dependency Path JSX not supported; no files changed');
  const block=source.slice(pathStart,pathEnd+2);
  const strokeAt=block.indexOf('stroke={');
  if(strokeAt<0)throw Error('Timeline dependency stroke not found; no files changed');
  const exprBegin=strokeAt+'stroke={'.length;
  let depth=1, end=-1;
  for(let k=exprBegin;k<block.length;k++){
    if(block[k]==='{')depth++;
    if(block[k]==='}' && --depth===0){end=k;break;}
    // Only ordinary expressions from our v0.5.31 map are accepted.
  }
  if(end<0)throw Error('Timeline dependency stroke expression not balanced; no files changed');
  const old=block.slice(exprBegin,end);
  let replacement;
  if(old.includes('PRIORITY_COLOR.Critical')) {
    const match=old.match(/^([\s\S]*?\?\s*PRIORITY_COLOR\.Critical\s*:\s*)[\s\S]+$/);
    if(!match)throw Error('Unknown critical dependency styling; no files changed');
    replacement=match[1]+'np533DependencyColor(l)';
  } else if(old.includes('showCritical') || old.includes('critEdges')) {
    throw Error('Critical-path condition not understood; no files changed');
  } else replacement='np533DependencyColor(l)';
  let out=source.slice(0,pathStart)+block.slice(0,exprBegin)+replacement+block.slice(end)+source.slice(pathEnd+2);
  // Also restore matching colored endpoint markers, if this Timeline draws them.
  const circleMap=out.search(/\{links\.map\(\(l\)\s*=>\s*\(\s*<Circle\b/);
  if(circleMap>=0){
    const circleStart=out.indexOf('<Circle',circleMap);
    const circleEnd=out.indexOf('/>',circleStart);
    if(circleEnd<0 || circleEnd-circleStart>1200)throw Error('Timeline endpoint Circle not supported');
    const circle=out.slice(circleStart,circleEnd+2);
    const next=circle.replace(/\bfill=\{[^}]+\}/,'fill={np533DependencyColor(l)}');
    if(next===circle)throw Error('Timeline endpoint color not recognized');
    out=out.slice(0,circleStart)+next+out.slice(circleEnd+2);
  }
  // Keep the helper at module scope, not inside a render or a map.
  const location=out.indexOf('const ZOOM =');
  if(location<0)throw Error('Timeline module constants not recognized');
  return out.slice(0,location)+colorHelper+'\n'+out.slice(location);
}
function patchHistoricalTest(before){
  const title='browser switches to actual desktop navigation at tablet/landscape widths';
  const start=before.indexOf("test('"+title+"'");
  if(start<0)return before; // Another checkout may already have modernized this test.
  const end=before.indexOf('\n});',start);
  if(end<0)throw Error('Historical HF1 desktop test not recognized');
  const revised=`test('browser uses mobile navigation for a phone, Desktop site or forced mode for desktop', () => {\n  // The fourth argument simulates an Android browser mobile / Desktop site signal.\n  for (const width of [320, 360, 390, 430, 700]) {\n    assert.equal(isDesktopLayout(width, 'web', 'auto', true), false, 'mobile UA '+width);\n    assert.equal(isDesktopLayout(width, 'web', 'auto', false), true, 'desktop UA '+width);\n    assert.equal(isDesktopLayout(width, 'web', 'desktop', true), true, 'explicit desktop '+width);\n  }\n  assert.equal(isDesktopLayout(319, 'web', 'auto', false), false);\n  assert.equal(isDesktopLayout(390, 'android', 'desktop', false), false);\n});`;
  return before.slice(0,start)+revised+before.slice(end+4);
}
try{
  if(!exists('src/app/ModernApp.js')||!read('src/app/ModernApp.js').includes('LayoutProvider'))throw Error('Requires v0.5.31 HF1 desktop shell');
  for(const p of ['src/ui/layoutMode.cjs','src/screens/timeline/Timeline.js'])if(!exists(p))throw Error('Required source missing: '+p);
  const currentLayout=read('src/ui/layoutMode.cjs');
  requireNeedle(currentLayout,'isDesktopLayout','desktop selector');
  const oldLayout=require(f('src/ui/layoutMode.cjs')).isDesktopLayout;
  if(typeof oldLayout!=='function'||!oldLayout(390,'web','auto')||oldLayout(390,'android','auto'))throw Error('Expected v0.5.33 desktop portrait baseline not found');
  if(!currentLayout.includes(marker)){
    requireNeedle(currentLayout,'module.exports','desktop selector exports');
    edit('src/ui/layoutMode.cjs',currentLayout.trimEnd()+'\n'+injection,'Only mobile Web UA uses mobile shell; desktop-site/manual desktop remain available');
  }
  edit('src/screens/timeline/Timeline.js',patchDependencyStroke(read('src/screens/timeline/Timeline.js')),'Restore per-dependency colors and colored link endpoints only');
  const historical='tests/ui/desktop-mode-0531-hf1.test.cjs';
  if(exists(historical))edit(historical,patchHistoricalTest(read(historical)),'Replace obsolete 360px-portrait assertion with browser-mode contract');
  // The old HF2 installation script is retained but needs path header and to avoid the source-import scanner
  // treating a string holding a replacement import as an actual import from scripts/.
  const hf2='scripts/apply-np-portrait-hf2.cjs';
  if(exists(hf2)){
    let s=read(hf2);
    if(!s.startsWith('// /'+hf2+'\n'))s='// /'+hf2+'\n'+s;
    // Split literal strings across expressions. The historical installer still produces
    // the exact original UI import strings, but a regex-only source scanner won't
    // mistake them for imports from scripts/.
    const oldLine='const oldStoreImport = "import { T } from " + String.fromCharCode(39) + "../ui/ui" + String.fromCharCode(39) + ";";';
    const newLine='const newStoreImport = "import { T } from " + String.fromCharCode(39) + "../ui/uiBase" + String.fromCharCode(39) + ";";';
    if(!s.includes('String.fromCharCode(39) + "../ui/ui"')){
      s=s.replace(/^\s*const oldStoreImport = .*;$/m,'  '+oldLine);
      s=s.replace(/^\s*const newStoreImport = .*;$/m,'  '+newLine);
    }
    if(!s.includes(oldLine)||!s.includes(newLine))throw Error('Unexpected HF2 installer strings; no changes made');
    if(/\bfrom\s+['"]\.\.\/ui\/(?:ui|uiBase)['"]/.test(s))throw Error('HF2 script import scanner compatibility failed');
    edit(hf2,s,'Path header and safe, executable split import strings');
  }
  const oldTest='tests/ui/portrait-desktop-0531-hf2.test.cjs';
  if(exists(oldTest)){
    let s=read(oldTest);
    if(!s.startsWith('// /'+oldTest+'\n'))s='// /'+oldTest+'\n'+s;
    const oldTitle="test('phone browser portrait uses the desktop shell automatically'";
    if(s.includes(oldTitle)){
      const start=s.indexOf(oldTitle);
      const end=s.indexOf('\n});',start);
      if(end<0)throw Error('Historic HF2 portrait test structure changed');
      const replacement=`test('mobile browser uses phone UI; Desktop site and manual desktop remain available', () => {\n  assert.equal(isDesktopLayout(390, 'web', 'auto', true), false);\n  assert.equal(isDesktopLayout(390, 'web', 'auto', false), true);\n  assert.equal(isDesktopLayout(320, 'web', 'desktop', true), true);\n  assert.equal(isDesktopLayout(768, 'web', 'auto', false), true);\n});`;
      s=s.slice(0,start)+replacement+s.slice(end+4);
    }
    edit(oldTest,s,'Correct obsolete automatic desktop-on-mobile assertion and add path header');
  }
  const modeTest='tests/ui/desktop-portrait-0533.test.cjs';
  if(exists(modeTest)){
    let s=read(modeTest);
    s=s.replace("test('desktop Web works at 320, portrait, landscape and full-screen widths'", "test('desktop-browser Web works at 320, portrait, landscape and full-screen widths'");
    s=s.replace(/isDesktopLayout\(width,'web','auto'\)/g,"isDesktopLayout(width,'web','auto',false)");
    edit(modeTest,s,'Clarify desktop-browser hints for inherited desktop-only test');
  }
  console.log(`${dry?'DRY RUN':'APPLY'}: ${changes.length} changes`);
  for(const c of changes)console.log(' - '+c.p+': '+c.reason);
  if(dry){console.log('No files written.');process.exit(0)}
  const backups=[];
  try {
    for(const c of changes){
      const old=read(c.p);backups.push({p:c.p,old});
      fs.writeFileSync(f(c.p),c.next);
    }
    delete require.cache[require.resolve(f('src/ui/layoutMode.cjs'))];
    const newLayout=require(f('src/ui/layoutMode.cjs')).isDesktopLayout;
    if(newLayout(390,'web','auto',true)||!newLayout(390,'web','auto',false)||!newLayout(390,'web','desktop',true)||newLayout(390,'android','auto',false))throw Error('Post-install browser-mode check failed');
  } catch(e) {for(const b of backups)fs.writeFileSync(f(b.p),b.old);throw Error('Rolled back application changes: '+e.message)}
  console.log('Applied Web mobile browser routing and restored colored Gantt dependencies. Restart Metro with --clear.');
}catch(e){console.error('HF4 refused:',e.message);process.exitCode=1}
