// /tests/helpers/redesign-review.cjs
'use strict';
const fs=require('node:fs');const path=require('node:path');const{connect}=require('./browser-cdp.cjs');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'docs/qa/redesign-063');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function main(){
 const phase=process.argv[2]||'after',c=await connect(9234);await c.send('Runtime.enable');await c.send('Page.enable');await c.send('Network.enable');await c.send('Network.setCacheDisabled',{cacheDisabled:true});await c.send('Runtime.discardConsoleEntries');c.events.length=0;
 await c.send('Emulation.setUserAgentOverride',{userAgent:'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/156.0.0.0 Mobile Safari/537.36',userAgentMetadata:{brands:[],platform:'Android',platformVersion:'15',architecture:'arm',model:'Review',mobile:true}});
 await c.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 c.send('Page.navigate',{url:'http://localhost:8094'}).catch(()=>{});await sleep(1000);
 let ready=false;for(let i=0;i<100;i++){ready=await c.evaluate(`!!document.querySelector('[aria-label="Work"]')`);if(ready)break;await sleep(500);}if(!ready)throw Error('App not ready: no Work tab; no captures accepted');
 const click=async label=>{const p=await c.evaluate(`(()=>{const el=[...document.querySelectorAll('[aria-label]')].find(e=>e.getAttribute('aria-label')===${JSON.stringify(label)}&&e.getBoundingClientRect().width>0);if(!el)throw Error('Missing '+${JSON.stringify(label)});el.scrollIntoView({block:'nearest'});const r=el.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await c.send('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await sleep(65);await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1});await sleep(250);};
 const shot=async name=>fs.writeFileSync(path.join(out,phase+'-'+name+'.png'),Buffer.from((await c.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 const results=[];
 await shot('overview-mobile');await click('More');await click('Resources');await shot('resources-mobile');await click('Go back');await click('Settings');await shot('settings-mobile');
 if(phase==='after'){
  await click('Work');await shot('board-mobile');await click('List');
  const taskLabel=await c.evaluate(`([...document.querySelectorAll('[aria-label]')].find(e=>e.getAttribute('aria-label').includes('priority')&&e.getBoundingClientRect().width>0))?.getAttribute('aria-label')`);
  if(taskLabel){await click(taskLabel);await shot('task-detail-mobile');await c.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await c.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await sleep(150);}
  await click('More');await click('Costs');await shot('costs-mobile');await click('Go back');await click('Automations');await shot('automations-mobile');
 }
 await c.send('Emulation.setUserAgentOverride',{userAgent:'Mozilla/5.0 (X11; Linux aarch64) AppleWebKit/537.36 Chrome/156.0.0.0 Safari/537.36',userAgentMetadata:{brands:[],platform:'Linux',platformVersion:'',architecture:'arm',model:'',mobile:false}});
 await c.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await c.send('Page.reload',{ignoreCache:true});await sleep(2000);await click('Timeline');await shot('timeline-desktop');
 results.push({width:await c.evaluate('innerWidth'),body:await c.evaluate('document.body.innerText.slice(-250)')});
 const consoleEvents=c.events.filter(e=>e.method==='Runtime.exceptionThrown'||e.method==='Runtime.consoleAPICalled'&&['error','warning'].includes(e.params.type));fs.writeFileSync(path.join(out,phase+'-browser.json'),JSON.stringify({results,console:consoleEvents},null,2));console.log('Captured',phase,'review; console events',consoleEvents.length);c.close();
}
main().catch(e=>{console.error(e);process.exit(1)});
