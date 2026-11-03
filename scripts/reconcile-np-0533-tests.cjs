// /scripts/reconcile-np-0533-tests.cjs
'use strict';
// Reconcile tests left behind by a Sonnet 0.5.32 checkout after HF1/HF2 source restoration.
// Original tests are archived, not deleted. Production changes: one priority-dot label only.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const dry = process.argv.includes('--dry-run');
const file = p => path.join(root, p);
const exists = p => fs.existsSync(file(p));
const read = p => fs.readFileSync(file(p), 'utf8');
const plans = [];
const archiveRoot = 'docs/qa/historical-sonnet-0532';
function archive(original, dest) {
  if (!exists(original)) return;
  const bytes = read(original);
  if (exists(dest) && read(dest) !== bytes) throw Error(`Archive differs: ${dest}; manually reconcile first`);
  plans.push({kind:'archive', original, dest, bytes});
}
function edit(rel, next, summary) {
  if (next !== read(rel)) plans.push({kind:'edit', rel, next, summary});
}
try {
  if (!exists('src/ui/layoutMode.cjs') || !exists('src/app/ModernApp.js') ||
      !read('src/app/ModernApp.js').includes('LayoutProvider') ||
      !read('src/store/store.js').includes("import { T } from " + "'../ui/uiBase';") ||
      !read('src/screens/tasks/Tasks.js').includes('NP533_COLUMNS') ||
      !read('src/screens/overview/Overview.js').includes('Open releases')) {
    throw Error('Requires installed HF1 + portrait HF2 + successful 0.5.33 merge. No changes made.');
  }
  const {isDesktopLayout} = require(file('src/ui/layoutMode.cjs'));
  if (!isDesktopLayout(390,'web','auto') || isDesktopLayout(390,'android','auto'))
    throw Error('Desktop portrait/native behavior is not as expected. No changes made.');

  // Sonnet-specific suites assert its 720px shell, 0532 theme API, flexible column widths,
  // and month-band rewrite. None of those contracts belong to the HF2/0533 design.
  const foreign = [
    ['tests/app/shell-redesign-0531.test.cjs',['boardColumnWidth','visibleMonths','accentFill']],
    ['tests/ui/layout-0531.test.cjs',['accentTokens','boardColumnWidth','sidebarCollapsed']],
  ];
  for (const [rel, signals] of foreign) {
    if (!exists(rel)) continue;
    if (!signals.every(s => read(rel).includes(s))) throw Error(`Unknown version of ${rel}; leaving it intact`);
    archive(rel, `${archiveRoot}/${path.basename(rel)}.historical.txt`);
  }

  // Adapt the original HF1 regression suite to the approved portrait Web breakpoint.
  // Preserve every other test in that file, including menu, toolbar and native checks.
  const desktopTest = 'tests/ui/desktop-mode-0531-hf1.test.cjs';
  if (exists(desktopTest)) {
    const before = read(desktopTest);
    let after = before.replace(/\b700\b/g, '320');
    // Before HF2, Web auto widths 390/600 were expected to be phone. Those expectations
    // now contradict the approved Web desktop-at-320 behavior. Only adjust literal auto
    // assertions (not manual mode or native platform assertions).
    after = after.replace(/(assert\.(?:strictEqual|equal)\(\s*isDesktopLayout\(\s*(\d+)\s*,\s*(['"])web\3(?:\s*,\s*(['"])auto\4)?\s*\)\s*,\s*)false(\s*\))/g,
      (all, prefix, width, quote, autoQuote, suffix) => Number(width) >= 320 ? prefix + 'true' + suffix : all);
    // Handle alternate argument order in multiline assertions by preserving the original
    // test if its form is unsupported. A targeted portrait test below still protects it.
    if (!after.includes('320')) throw Error(`Unrecognized desktop breakpoint test: ${desktopTest}`);
    if (after !== before) {
      archive(desktopTest, `${archiveRoot}/desktop-mode-0531-hf1.test.cjs.before-hf2.txt`);
      edit(desktopTest, after, 'Update historical 700px/phone assertions to 320px Web desktop contract');
    }
  }
  // Add an independent live contract test, so portrait behavior is covered even when
  // the historical test has different source formatting.
  const portraitTest = 'tests/ui/desktop-portrait-0533.test.cjs';
  const portraitSrc = `// /tests/ui/desktop-portrait-0533.test.cjs\n'use strict';\nconst test=require('node:test');\nconst assert=require('node:assert/strict');\nconst {isDesktopLayout}=require('${'../../' + 'src/ui/layoutMode.cjs'}');\ntest('desktop Web works at 320, portrait, landscape and full-screen widths',()=>{\n for(const width of [320,360,390,430,700,768,1440])assert.equal(isDesktopLayout(width,'web','auto'),true,width+'px Web');\n assert.equal(isDesktopLayout(319,'web','auto'),false);\n});\ntest('native portrait keeps its phone UI and Web preference is Web-only',()=>{\n for(const platform of ['android','ios']){assert.equal(isDesktopLayout(390,platform,'auto'),false);assert.equal(isDesktopLayout(390,platform,'desktop'),false)}\n assert.equal(isDesktopLayout(319,'web','desktop'),true);\n});\n`;
  if (!exists(portraitTest)) plans.push({kind:'add',rel:portraitTest,next:portraitSrc,summary:'Live portrait Web and native separation tests'});
  else if (read(portraitTest) !== portraitSrc) throw Error(`Existing different test: ${portraitTest}`);

  // Keep release notes, but no CHG-NP or NP-QA files may live in the app root.
  // The old 0.5.1 repository layout test enforces that existing convention.
  for(const n of fs.readdirSync(root)) {
    if (!/^(?:CHG-NP-|NP-QA-).*\.md$/.test(n)) continue;
    archive(n, `docs/qa/release-notes/${n}`);
  }

  // Sonnet's original test also revealed a genuine A11y issue in the older compact
  // Board: the priority was communicated only by a tiny colored dot. Name it without
  // changing appearance, dimensions, drag handlers or layout math.
  const boardFile='src/screens/board/Board.js';
  let board = read(boardFile);
  const priorityDot = /<View style=\{\{\s*width:\s*7\s*,\s*height:\s*7\s*,\s*borderRadius:\s*4\s*,\s*backgroundColor:\s*PRIORITY_COLOR\[t\.priority\]\s*\}\}\s*\/>/;
  if (priorityDot.test(board)) {
    board=board.replace(priorityDot,'<View accessible accessibilityLabel={`Priority ${t.priority}`} style={{width:7,height:7,borderRadius:4,backgroundColor:PRIORITY_COLOR[t.priority]}}/>');
    edit(boardFile,board,'Expose Board priority to assistive technology (no geometry change)');
  } else if(!board.includes('accessibilityLabel={`Priority ${t.priority}`}')) {
    throw Error('Unexpected Board priority badge markup. No changes made.');
  }
  const priorityTest='tests/ui/board-priority-a11y-0533.test.cjs';
  const prioritySrc=`// /tests/ui/board-priority-a11y-0533.test.cjs\n'use strict';\nconst test=require('node:test');\nconst assert=require('node:assert/strict');\nconst fs=require('node:fs');\nconst path=require('node:path');\ntest('priority color dot includes accessible priority name',()=>{\n const s=fs.readFileSync(path.join(__dirname,'../../src/screens/board/Board.js'),'utf8');\n assert.match(s,/accessible accessibilityLabel=\\{\x60Priority \\$\\{t\\.priority\\}\x60\\}/);\n});\n`;
  if (!exists(priorityTest)) plans.push({kind:'add',rel:priorityTest,next:prioritySrc,summary:'Priority accessibility regression'});
  else if(read(priorityTest)!==prioritySrc)throw Error(`Existing different test: ${priorityTest}`);

  // Full preflight complete; no source was touched above.
  console.log(`${dry?'DRY RUN':'APPLY'}: ${plans.length} planned changes`);
  for(const p of plans)console.log(` - ${p.kind}: ${p.original||p.rel} ${p.dest?'→ '+p.dest:''} ${p.summary||''}`);
  if(dry){console.log('No files written.');process.exit(0)}
  for(const p of plans) {
    if(p.kind==='archive'){
      fs.mkdirSync(path.dirname(file(p.dest)),{recursive:true});
      if(!exists(p.dest))fs.writeFileSync(file(p.dest),p.bytes);
      fs.unlinkSync(file(p.original));
    } else {
      fs.mkdirSync(path.dirname(file(p.rel)),{recursive:true});
      fs.writeFileSync(file(p.rel),p.next);
    }
  }
  console.log('Reconciled historical Sonnet tests and 0.5.31 HF1 expectations; data and engines untouched.');
} catch(e){console.error('Reconciliation refused:',e.message);process.exitCode=1}
