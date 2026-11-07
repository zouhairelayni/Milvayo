// /tests/helpers/canvas-global-audit.cjs
'use strict';
const fs=require('node:fs'),path=require('node:path'),parser=require('@babel/parser'),traverse=require('@babel/traverse').default;
const root=path.resolve(__dirname,'../..'),out=path.join(root,'docs/qa/release-080');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]),files=walk(path.join(root,'src')).filter(f=>/\.(js|cjs)$/.test(f));
const globals=new Set([...Object.getOwnPropertyNames(globalThis),'window','document','navigator','requestAnimationFrame','cancelAnimationFrame','Image','FileReader','File','Blob','URL','localStorage','sessionStorage','alert','confirm','CSS','__DEV__','require','module','exports','__dirname','global','HermesInternal','ResizeObserver','IntersectionObserver','Worker']);
const unknown=[],unusedImports=[],forwardWorklets=[];
for(const filename of files){const file=path.relative(root,filename),ast=parser.parse(fs.readFileSync(filename,'utf8'),{sourceType:'unambiguous',plugins:['jsx']});traverse(ast,{
 ReferencedIdentifier(p){const name=p.node.name;if(!globals.has(name)&&!p.scope.hasBinding(name))unknown.push({file,line:p.node.loc.start.line,name});},
 ImportDeclaration(p){for(const specifier of p.node.specifiers){const binding=p.scope.getBinding(specifier.local.name);if(binding&&!binding.referenced)unusedImports.push({file,line:specifier.loc.start.line,name:specifier.local.name});}},
 FunctionDeclaration(p){if(!p.parentPath.isProgram()||!p.node.body.directives?.some(d=>d.value.value==='worklet'))return;const seen=new Set();p.traverse({ReferencedIdentifier(ref){const name=ref.node.name,binding=ref.scope.getBinding(name);if(!binding||binding.scope!==p.scope.parent||binding.path.node===p.node||binding.path.node.start<p.node.start||seen.has(name))return;seen.add(name);forwardWorklets.push({file,function:p.node.id.name,captures:name,line:ref.node.loc.start.line});}});},
});}
const compatibilityImports=unusedImports.filter(item=>item.name==='React');
const removableImports=unusedImports.filter(item=>item.name!=='React');
const report={scope:'All src JS/CJS bindings/imports and eager module-level worklet dependency order; dynamic platform acceptance remains separate',files:files.length,unboundIdentifiers:unknown,unusedImports:removableImports,compatibilityImports,compatibilityNote:'Default React imports are retained for existing classic JSX test transforms.',forwardWorkletCaptures:forwardWorklets};
fs.writeFileSync(path.join(out,'source-audit.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({files:files.length,unboundIdentifiers:unknown,unusedImports:removableImports,compatibilityImports:compatibilityImports.length,forwardWorkletCaptures:forwardWorklets},null,2));if(unknown.length||forwardWorklets.length)process.exitCode=1;
