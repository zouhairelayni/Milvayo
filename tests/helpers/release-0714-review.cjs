// /tests/helpers/release-0714-review.cjs
'use strict';
// Render actual source JSX to static RN Web fixtures, without Metro/builds/Playwright.
const fs=require('node:fs'),vm=require('node:vm');
let source=fs.readFileSync(require.resolve('./render-redesign-review.cjs'),'utf8');
source=source.replace('docs/qa/redesign-063/source-review','docs/qa/release-0714/source-review');
source=source.slice(0,source.indexOf("capture('overview-mobile'"));
source+=`
const Skeleton=read('src/components/loading/ScreenSkeleton.js').default;
for(const m of ['light','dark'])for(const screen of ['board','timeline','tasks','sprints']){
 mode=m;capture(screen+'-'+m, Skeleton,{screen,active:false},390,844,false);
}
mode='dark';capture('board-landscape',Skeleton,{screen:'board',active:false},844,390,false);capture('timeline-desktop',Skeleton,{screen:'timeline',active:false},1440,900,false);
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2));console.log('Rendered',manifest.length,'static source fixtures; not Expo/native acceptance');
`;
vm.runInThisContext('(function(require,module,exports,__dirname){'+source+'\n})',{filename:__filename})(require,module,module.exports,__dirname);
