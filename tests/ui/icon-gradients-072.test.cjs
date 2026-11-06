// /tests/ui/icon-gradients-072.test.cjs
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {unzlibSync}=require('fflate');
const {ACCENTS}=require('../../src/ui/theme/themePalette.cjs');
const {iconPalette}=require('../../src/ui/theme/iconPalette.cjs');
const {iconSvg}=require('../../src/components/brand/iconArtwork.cjs');
function pixels(file){
 const b=fs.readFileSync(file),w=b.readUInt32BE(16),h=b.readUInt32BE(20),channels=b[25]===6?4:3,idat=[];
 assert.equal(b[24],8);assert.ok([2,6].includes(b[25]));
 for(let i=8;i<b.length;){const n=b.readUInt32BE(i),type=b.toString('ascii',i+4,i+8);if(type==='IDAT')idat.push(b.subarray(i+8,i+8+n));i+=12+n;}
 const raw=unzlibSync(Buffer.concat(idat)),out=new Uint8Array(w*h*channels),stride=w*channels;
 const paeth=(a,b,c)=>{const p=a+b-c,x=Math.abs(p-a),y=Math.abs(p-b),z=Math.abs(p-c);return x<=y&&x<=z?a:y<=z?b:c;};
 let pos=0;for(let y=0;y<h;y++){const filter=raw[pos++];for(let x=0;x<stride;x++){const i=y*stride+x,a=x>=channels?out[i-channels]:0,up=y?out[i-stride]:0,c=y&&x>=channels?out[i-stride-channels]:0;out[i]=(raw[pos++]+[0,a,up,Math.floor((a+up)/2),paeth(a,up,c)][filter])&255;}}
 return {w,h,at(x,y){const i=(y*w+x)*channels;return [...out.subarray(i,i+3),channels===4?out[i+3]:255];}};
}
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
test('all thirty real icon PNGs have opaque gradient backgrounds and a solid resolved theme-color mark',()=>{
 for(const a of ACCENTS)for(const mode of ['light','dark','amoled']){
  const p=pixels(`public/icons/theme/${a.id.toLowerCase()}-${mode}-64.png`),colors=iconPalette(a.id,mode);
  assert.equal(p.w,64);assert.equal(p.h,64);assert.notDeepEqual(p.at(1,1),p.at(62,62),`${a.id}/${mode} gradient`);
  assert.equal(p.at(1,1)[3],255);assert.equal(p.at(62,62)[3],255);assert.deepEqual(p.at(32,42).slice(0,3),rgb(colors.ink),`${a.id}/${mode} solid logo`);
  const background=iconSvg(a.id,mode,{layer:'background'});assert.ok(!background.includes(colors.ink),'primary ink is absent from background artwork');
 }
});
test('adaptive layers stay separate and all aliases plus primary configure a real gradient background image',()=>{
 const app=require('../../app.json').expo,foreground=pixels('assets/adaptive-icon.png'),background=pixels('assets/adaptive-background.png');
 assert.equal(foreground.at(0,0)[3],0);assert.equal(foreground.at(512,672)[3],255);assert.equal(background.at(0,0)[3],255);
 const all=[app.android.adaptiveIcon,...app.plugins.find(p=>Array.isArray(p)&&p[0]==='expo-alternate-app-icons')[1].map(p=>p.android)];
 assert.equal(all.length,30);for(const icon of all){assert.ok(icon.backgroundImage);const b=fs.readFileSync(icon.backgroundImage);assert.equal(b.readUInt32BE(16),1024);assert.equal(b.readUInt32BE(20),1024);}
});
test('launcher prompt is platform neutral and still confirms durable saving before apply',()=>{
 const s=fs.readFileSync('src/screens/workspace/Workspace.js','utf8');assert.match(s,/Your app Milvayo will restart to refresh its icon/);assert.doesNotMatch(s,/Android may close|Expo Go cannot change/);assert.match(s,/syncLauncherIcon\(accentPref,mode,flush\)/);
});
