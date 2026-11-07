// /tests/governance/diagram-export.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {pngPlan,pngDimensions}=require('../../src/governance/diagramExport.cjs');
const {sceneFor,sceneToSvg}=require('../../src/governance/diagramScene.cjs');
const {pm,fixture}=require('../helpers/wbs-harness.cjs');
const {load}=require('../helpers/diagram-harness.cjs'),{fakeClock}=require('../helpers/lifecycle-harness.cjs');
const png=(width,height)=>{const b=Buffer.alloc(33);Buffer.from([137,80,78,71,13,10,26,10]).copy(b);b.writeUInt32BE(13,8);b.write('IHDR',12);b.writeUInt32BE(width,16);b.writeUInt32BE(height,20);return b.toString('base64');};
const colors={ink:'#fafafa',bg:'#0c0d0f',surface:'#17191c',muted:'#b4bac6'};

test('2×/4× PNG plans include the entire aspect ratio and enforce pixel/side budgets for narrow, tall and very large diagrams',()=>{
 for(const platform of ['web','android','ios'])for(const [width,height] of [[800,400],[100,100],[61618,474],[1103,7572],[1497,8540],[1,1000000]])for(const scale of [2,4]){
  const p=pngPlan({width,height},scale,platform);assert.ok(p.width>0&&p.height>0);assert.ok(p.pixels<=p.maxPixels);assert.ok(p.width<=p.maxSide&&p.height<=p.maxSide);
  assert.ok(p.scale<=scale);if(!p.limited){assert.equal(p.width,width*scale);assert.equal(p.height,height*scale);}
  assert.ok(Math.abs(p.width-width*p.scale)<1.01);assert.ok(Math.abs(p.height-height*p.scale)<1.01);
 }
 for(const bad of [{width:0,height:1},{width:NaN,height:2},{width:1,height:Infinity}])assert.throws(()=>pngPlan(bad),/Invalid/);
 assert.throws(()=>pngPlan({width:10,height:10},3),/2× or 4×/);assert.deepEqual(pngDimensions(png(1600,800)),{width:1600,height:800});assert.throws(()=>pngDimensions('invalid'),/Invalid/);
});
test('all three SVG exports retain all primitives, complete dimensions, escaped labels and explicit background choice without changing scenes',()=>{
 const tree=pm.buildTree(fixture().map(n=>n.id==='w1'?{...n,name:'<Design> & "proof"'}:n),'Studio & team');
 for(const kind of ['tree','fishbone','mind']){
  const scene=sceneFor(kind,tree,'down'),saved=JSON.stringify(scene),svg=sceneToSvg(scene,colors),transparent=sceneToSvg(scene,colors,{transparent:true});
  assert.ok(svg.includes(`viewBox="0 0 ${scene.width} ${scene.height}"`));assert.match(svg,/&amp;/);assert.doesNotMatch(svg,/<Design>/);
  assert.equal((svg.match(/<(?:path|rect|text) /g)||[]).length,scene.items.length+1);assert.match(svg,/<rect width="100%"/);assert.doesNotMatch(transparent,/<rect width="100%"/);assert.equal(JSON.stringify(scene),saved);
 }
 const csv=pm.wbsCSV(tree);assert.match(csv,/code,level,name,owner,hours,note/);assert.match(csv,/Studio & team/);
});
test('native PNG captures explicit full-scene dimensions, writes actual base64 bytes, shares PNG and bounds retained export files',async()=>{
 const clock=fakeClock(),files=[],shares=[];let available=true;
 class File{constructor(...args){this.uri=args.map(x=>x.uri||x).join('/');this.name=args.at(-1);files.push(this);this.exists=false;}create(){this.exists=true;}write(data,options){this.data=data;this.options=options;}delete(){this.exists=false;}}
 class Directory{constructor(...args){this.uri=args.join('/');this.exists=false;}create(){this.exists=true;}list(){return files.filter(f=>f.exists);}}
 const mod=load('src/governance/diagramPng.native.js',{'expo-file-system':{Directory,File,Paths:{cache:'cache'}},'expo-sharing':{isAvailableAsync:async()=>available,shareAsync:async(...a)=>shares.push(a)}},[],{...clock});
 const plan=pngPlan({width:800,height:400},2,'android');let options;
 const data=await mod.rasterizeDiagram({svgRef:{current:{toDataURL:(fn,o)=>{options=o;fn(png(o.width,o.height));}}},plan});
 assert.deepEqual(JSON.parse(JSON.stringify(options)),{width:1600,height:800});assert.equal(clock.size,0);
 for(let i=0;i<4;i++)await mod.saveDiagramPng('diagram-'+i+'.png',data);
 assert.equal(files[0].exists,false);assert.equal(files.filter(f=>f.exists).length,3);assert.equal(files[1].options.encoding,'base64');assert.equal(shares[0][1].mimeType,'image/png');assert.equal(shares[0][1].UTI,'public.png');
 available=false;await assert.rejects(mod.saveDiagramPng('missing.png',data),/sharing is unavailable/);assert.equal(files.length,4);
});
test('native capture rejects wrong dimensions, invalid data, timeout and aborted/late callbacks without leaked timers',async()=>{
 const clock=fakeClock(),mod=load('src/governance/diagramPng.native.js',{'expo-file-system':{},'expo-sharing':{}},[],{...clock}),plan={width:100,height:50};
 for(const data of ['bad',png(10,5)])await assert.rejects(mod.rasterizeDiagram({svgRef:{current:{toDataURL:fn=>fn(data)}},plan}));
 assert.equal(clock.size,0);let callback;const ref={current:{toDataURL:fn=>{callback=fn;}}};
 const abort=new AbortController(),pending=mod.rasterizeDiagram({svgRef:ref,plan,signal:abort.signal});abort.abort();await assert.rejects(pending,/cancelled/);callback(png(100,50));assert.equal(clock.size,0);
 const timeout=mod.rasterizeDiagram({svgRef:ref,plan});clock.advance(12000);await assert.rejects(timeout,/timed out/);assert.equal(clock.size,0);
});
test('web PNG rasterizes a complete SVG, releases object URLs/canvas memory and surfaces encoding errors',async()=>{
 const calls=[],urls=[],revoked=[],canvas={width:0,height:0,getContext:()=>({drawImage:(...a)=>calls.push(a)}),toBlob:fn=>fn(new Blob(['png'],{type:'image/png'}))};
 class Image{set src(value){if(value)queueMicrotask(()=>this.onload?.());}}
 const mod=load('src/governance/diagramPng.js',{},[],{document:{fonts:{ready:Promise.resolve()},createElement:()=>canvas},Image,Blob,URL:{createObjectURL:blob=>{urls.push(blob);return 'blob:diagram';},revokeObjectURL:u=>revoked.push(u)}});
 const scene=sceneFor('tree',pm.buildTree(fixture(),'Studio'),'down'),plan=pngPlan(scene,4);
 const blob=await mod.rasterizeDiagram({scene,colors,plan,transparent:false});assert.equal(blob.type,'image/png');assert.equal(calls[0][3],plan.width);assert.equal(calls[0][4],plan.height);
 assert.match(await urls[0].text(),new RegExp(`viewBox="0 0 ${scene.width} ${scene.height}"`));assert.deepEqual(revoked,['blob:diagram']);assert.equal(canvas.width,0);assert.equal(canvas.height,0);
 canvas.toBlob=fn=>fn(null);await assert.rejects(mod.rasterizeDiagram({scene,colors,plan}),/encoding failed/);assert.equal(canvas.width,0);assert.equal(revoked.length,2);
});
