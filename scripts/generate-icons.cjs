// /scripts/generate-icons.cjs
'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const {ACCENTS}=require('../src/ui/theme/themePalette.cjs');
const {iconPalette}=require('../src/ui/theme/iconPalette.cjs');
const {iconSvg}=require('../src/components/brand/iconArtwork.cjs');
const root=path.resolve(__dirname,'..'),modes=['light','dark','amoled'];
const write=(file,data)=>{const target=path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,data);};
function render(accent,mode,options){
 const result=spawnSync(process.env.MILVAYO_RSVG_CONVERT||'rsvg-convert',[],{input:iconSvg(accent,mode,options),maxBuffer:8*1024*1024});
 if(result.error||result.status!==0)throw Error('Icon rasterization failed: '+(result.error?.message||result.stderr.toString()));
 return result.stdout;
}
function generate(){
 const app=JSON.parse(fs.readFileSync(path.join(root,'app.json')));
 for(const a of ACCENTS)for(const mode of modes){
  const slug=`${a.id.toLowerCase()}-${mode}`,base=`assets/theme-icons/${slug}`;
  for(const layer of ['complete','foreground','background'])write(base+(layer==='complete'?'-icon.png':`-${layer}.png`),render(a.id,mode,{layer}));
  for(const size of [64,180,192,512])write(`public/icons/theme/${slug}-${size}.png`,render(a.id,mode,{size}));
  write(`public/icons/theme/${slug}-maskable-512.png`,fs.readFileSync(path.join(root,`public/icons/theme/${slug}-512.png`)));
  const file=`public/manifests/${slug}.json`,manifest=JSON.parse(fs.readFileSync(path.join(root,file)));
  manifest.background_color=iconPalette(a.id,mode).background[0];
  manifest.icons=manifest.icons.map(icon=>({...icon,src:icon.src.split('?')[0]+'?v=072-gradients'}));write(file,JSON.stringify(manifest,null,2)+'\n');
 }
 const copy=(from,to)=>write(to,fs.readFileSync(path.join(root,from)));
 for(const a of ACCENTS){
  copy(`public/icons/theme/${a.id.toLowerCase()}-dark-64.png`,`public/icons/colorways/${a.id.toLowerCase()}-64.png`);
  copy(`assets/theme-icons/${a.id.toLowerCase()}-dark-icon.png`,`assets/app-icons/${a.id.toLowerCase()}.png`);
 }
 copy('assets/theme-icons/coral-dark-icon.png','assets/icon.png');
 copy('assets/theme-icons/coral-dark-foreground.png','assets/adaptive-icon.png');
 copy('assets/theme-icons/coral-dark-background.png','assets/adaptive-background.png');
 write('assets/adaptive-monochrome.png',render('Coral','dark',{layer:'foreground',ink:'#FFFFFF'}));
 for(const [from,to]of [['64','favicon.png'],['180','apple-touch-icon.png'],['192','icon-192.png'],['512','icon-512.png'],['maskable-512','icon-maskable-512.png']])copy(`public/icons/theme/coral-dark-${from}.png`,`public/icons/${to}`);
 copy('public/manifests/coral-dark.json','public/manifest.json');
 const adaptive=app.expo.android.adaptiveIcon;
 adaptive.backgroundImage='./assets/adaptive-background.png';adaptive.backgroundColor=iconPalette('Coral','dark').background[0];
 for(const entry of app.expo.plugins.find(p=>Array.isArray(p)&&p[0]==='expo-alternate-app-icons')[1]){
  const a=ACCENTS.find(a=>entry.name.startsWith(a.id)),mode=entry.name.slice(a.id.length).toLowerCase();
  entry.android.backgroundImage=`./assets/theme-icons/${a.id.toLowerCase()}-${mode}-background.png`;
  entry.android.backgroundColor=iconPalette(a.id,mode).background[0];
 }
 write('app.json',JSON.stringify(app,null,2)+'\n');
 console.log('Generated 30 icon variants, adaptive layers and matching PWA artwork.');
}
if(require.main===module)generate();
module.exports={generate};
