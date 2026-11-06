// /tests/app/source-syntax.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const parser=require('@babel/parser'),traverse=require('@babel/traverse').default;
const root=path.resolve(__dirname,'../..');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
test('every app source parses and every JSX component root has an import or local binding',()=>{
 const unresolved=[];
 for(const file of [path.join(root,'App.js'),...walk(path.join(root,'src'))].filter(f=>/\.(js|cjs)$/.test(f))){
  const ast=parser.parse(fs.readFileSync(file,'utf8'),{sourceType:'unambiguous',plugins:['jsx']});
  traverse(ast,{JSXOpeningElement(p){let n=p.node.name;while(n.type==='JSXMemberExpression')n=n.object;if(n.type==='JSXIdentifier'&&/^[A-Z]/.test(n.name)&&!p.scope.hasBinding(n.name))unresolved.push(path.relative(root,file)+': '+n.name);}});
 }
 assert.deepEqual(unresolved,[]);
});
