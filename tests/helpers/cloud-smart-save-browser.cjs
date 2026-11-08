// /tests/helpers/cloud-smart-save-browser.cjs
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{connect}=require('./browser-cdp.cjs');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function main(){const port=Number(process.argv[2]||9234),c=await connect(port),checks=[];let second;
 const wait=async(predicate,label)=>{for(let i=0;i<200;i++){if(await c.evaluate(predicate))return;await pause(200);}throw Error('Timed out: '+label);};
 const click=async label=>{assert.ok(await c.evaluate(`(()=>{const e=document.querySelector('[aria-label='+${JSON.stringify(JSON.stringify(label))}+']');if(!e)return false;e.click();return true;})()`),'Missing '+label);await pause(150);};
 const input=async(label,value)=>{await c.evaluate(`(()=>{const e=[...document.querySelectorAll('input,textarea')].find(e=>e.getAttribute('aria-label')===${JSON.stringify(label)});if(!e)throw Error('Missing '+${JSON.stringify(label)});Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(value)});e.dispatchEvent(new Event('input',{bubbles:true}));})()`);await pause(100);};
 try{
 await c.send('Runtime.enable');await c.send('Page.enable');await c.send('Page.navigate',{url:'http://127.0.0.1:8082'});await wait('document.body.innerText.includes("New task")','local app');
 await pause(1000);
 const tour=await c.evaluate('!!document.querySelector("[aria-label=\\\"Skip the tour\\\"]")');if(tour)await click('Skip the tour');
 const taskControl=await c.evaluate('[...document.querySelectorAll("[aria-label]")].map(e=>e.getAttribute("aria-label")).find(label=>label==="Continue task Implement workspace snapshots"||label.startsWith("Continue task QA durable title v085"))');
 assert.ok(taskControl,'Use an isolated Chromium profile with the Milvayo sample task');await click(taskControl);await wait('!!document.querySelector("[aria-label=\\\"Task title\\\"]")','task editor');
 const baseTitle=await c.evaluate(`document.querySelector('[aria-label="Task title"]').value`),title='QA durable title v085 '+Date.now();await input('Task title',title);
 await wait(`Object.keys(localStorage).filter(k=>k.startsWith('milvayo-task-draft-v1:')).some(k=>JSON.parse(localStorage.getItem(k)).patch.title===${JSON.stringify(title)})`,'durable raw title');
 assert.ok(!(await c.evaluate(`JSON.parse(localStorage.getItem('milvayo-v1')).projects.flatMap(p=>p.tasks).some(t=>t.title===${JSON.stringify(title)})`)),'Typing changed canonical task before blur/save');checks.push('Typed title persisted as a scoped draft without committing the task');
 // Reload without blurring the input: draft recovery must not depend on Save or editor closure.
 await c.send('Page.reload',{ignoreCache:true});await wait('document.body.innerText.includes("New task")','reload');await click('Continue task '+baseTitle);
 await wait(`document.querySelector('[aria-label="Task title"]')?.value===${JSON.stringify(title)}`,'draft restart recovery');checks.push('Reload during editing retained draft and reopened it');
 await c.evaluate('document.querySelector("[aria-label=\\\"Task title\\\"]").focus();document.activeElement.blur();document.querySelector("[aria-label=\\\"Save\\\"]").click()');
 await wait(`JSON.parse(localStorage.getItem('milvayo-v1')).projects.flatMap(p=>p.tasks).some(t=>t.title===${JSON.stringify(title)})`,'Save canonical persistence');await wait('document.body.innerText.includes("Saved on this device")','local acknowledgment');
 const revision=await c.evaluate("JSON.parse(localStorage.getItem('milvayo-v1')).revision");await click('Save');await pause(250);assert.equal(await c.evaluate("JSON.parse(localStorage.getItem('milvayo-v1')).revision"),revision);checks.push('Blur plus explicit Save persisted once; repeated unchanged Save made no domain mutation');
 await click('Planning & delivery');await click('Verification & delivery, Not verified');await pause(200);
 const advanced=await c.evaluate('(()=>{const p=[...document.querySelectorAll("div")].find(e=>e.textContent==="Expected result");return p?.parentElement.querySelector("textarea")?.outerHTML||null;})()');
 assert.ok(advanced,'Advanced expected result editor unavailable');
 await c.evaluate('(()=>{const p=[...document.querySelectorAll("div")].find(e=>e.textContent==="Expected result"),e=p.parentElement.querySelector("textarea");Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value").set.call(e,"QA advanced expected proof");e.dispatchEvent(new Event("input",{bubbles:true}));})()');await pause(150);await click('Save');
 await wait("JSON.parse(localStorage.getItem('milvayo-v1')).projects.flatMap(p=>p.tasks).some(t=>t.expected==='QA advanced expected proof')",'advanced Save');checks.push('Advanced verification text used the same durable combined Save');
 const target=await c.send('Target.createTarget',{url:'http://127.0.0.1:8082'});second=await connect(port,target.targetId);await pause(1500);
 let blocked=false;for(let i=0;i<100;i++){blocked=await second.evaluate('document.body.innerText.includes("another tab")||document.body.innerText.includes("Another tab")');if(blocked)break;await pause(200);}assert.ok(blocked,'Second app tab did not fail closed');
 checks.push('Second real app tab was blocked by the local single-writer gate');await click('Save');await c.send('Target.closeTarget',{targetId:target.targetId});second.close();second=null;
 const shot=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('docs/qa/cloud-085/task-save-web.png',Buffer.from(shot.data,'base64'));
 const result={status:'Pass',runtime:'Actual Expo Metro Web application, EXPO_OFFLINE=1 CI=1, headless Chromium',checks,cloudAcknowledgment:'Covered by session tests; actual emulator cloud UI check runs separately',fastRefresh:'Not run: CI mode disables watchers',expoGo:'Not run: no physical Android device'};fs.writeFileSync('docs/qa/cloud-085/task-save-web.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
 }finally{second?.close();c.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
