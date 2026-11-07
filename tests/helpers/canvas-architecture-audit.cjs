// /tests/helpers/canvas-architecture-audit.cjs
'use strict';
const fs=require('node:fs'),path=require('node:path'),parser=require('@babel/parser'),traverse=require('@babel/traverse').default;
const root=path.resolve(__dirname,'../..'),out=path.join(root,'docs/qa/release-081');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const files=walk(path.join(root,'src')).filter(f=>/\.(js|cjs)$/.test(f)),graph=new Map(),emptyHandlers=[],emptyCatches=[],modules=[];
for(const f of files){const code=fs.readFileSync(f,'utf8'),ast=parser.parse(code,{sourceType:'unambiguous',plugins:['jsx']}),name=path.relative(root,f),dependencies=new Set();modules.push({file:name,lines:code.split('\n').length});
 const resolve=id=>{if(!id.startsWith('.'))return;const base=path.resolve(path.dirname(f),id),resolved=['','.js','.cjs','.native.js','.web.js','.json'].map(ext=>base+ext).find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());if(resolved&&/\.(js|cjs)$/.test(resolved))dependencies.add(path.relative(root,resolved));};
 traverse(ast,{ImportDeclaration(p){resolve(p.node.source.value);},CallExpression(p){if(p.node.callee.name==='require'&&p.node.arguments[0]?.type==='StringLiteral')resolve(p.node.arguments[0].value);},JSXAttribute(p){if(!/^on[A-Z]/.test(p.node.name.name||''))return;const fn=p.node.value?.expression;if(fn?.body?.type==='BlockStatement'&&!fn.body.body.length)emptyHandlers.push({file:name,line:fn.loc.start.line,handler:p.node.name.name});},CatchClause(p){if(!p.node.body.body.length)emptyCatches.push({file:name,line:p.node.loc.start.line});}});graph.set(name,[...dependencies]);}
// Static SCCs include delayed requires; report them for review, not as proof of an initialization bug.
let serial=0;const indices=new Map(),low=new Map(),stack=[],active=new Set(),cycles=[];
function visit(v){indices.set(v,serial);low.set(v,serial++);stack.push(v);active.add(v);for(const w of graph.get(v)||[]){if(!indices.has(w)){visit(w);low.set(v,Math.min(low.get(v),low.get(w)));}else if(active.has(w))low.set(v,Math.min(low.get(v),indices.get(w)));}if(low.get(v)===indices.get(v)){const group=[];let w;do{w=stack.pop();active.delete(w);group.push(w);}while(w!==v);if(group.length>1)cycles.push(group.sort());}}
for(const f of graph.keys())if(!indices.has(f))visit(f);
const report={scope:'Static source graph, including lazy requires and platform alternatives; not runtime or native memory profiling',modules:files.length,emptyUIHandlers:emptyHandlers,emptyCatches,staticDependencyCycles:cycles,largestModules:modules.sort((a,b)=>b.lines-a.lines).slice(0,15),typeScriptFiles:walk(path.join(root,'src')).filter(f=>/\.tsx?$/.test(f)).map(f=>path.relative(root,f)),tsconfigPresent:fs.existsSync(path.join(root,'tsconfig.json'))};
fs.writeFileSync(path.join(out,'architecture-audit.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
