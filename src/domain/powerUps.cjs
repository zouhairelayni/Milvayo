// /src/domain/powerUps.cjs
'use strict';
const {localDay}=require('../utils/localDay.cjs');
// Built-in Niyarvo board extensions. No third-party code, untrusted execution, OAuth tokens, or privileged APIs.
const boards=require('./boards.cjs');
const CATALOG=Object.freeze([
 Object.freeze({id:'github',name:'GitHub',description:'Link issues, pull requests, commits and branches to cards'}),
 Object.freeze({id:'calendar',name:'Due soon',description:'Show this board’s upcoming tasks in List'}),
 Object.freeze({id:'aging',name:'Card aging',description:'Show days since each unfinished card was last updated'}),
 Object.freeze({id:'checklist',name:'Checklist progress',description:'Show acceptance check progress on cards'})
]);
const IDS=new Set(CATALOG.map(x=>x.id));
const err=message=>{throw Error(message)};
function normalizedPowerUps(project={}) {
 const known=new Set(boards.normalizedBoards(project).map(b=>b.id));
 const input=project.powerUps;
 if(input!==undefined && (!input||typeof input!=='object'||Array.isArray(input)))err('Invalid Power-Up settings');
 const out={};
 for(const [boardId,items] of Object.entries(input||{})){
  if(!known.has(boardId))err('Power-Ups reference a missing board');
  if(!Array.isArray(items)||items.length>CATALOG.length||items.some(x=>!IDS.has(x))||new Set(items).size!==items.length)err('Invalid Power-Up selection');
  out[boardId]=[...items];
 }
 return out;
}
function enabled(project,boardId,id){return IDS.has(id)&&(normalizedPowerUps(project)[boardId]||[]).includes(id)}
function toggle(project,boardId,id){if(!IDS.has(id))err('Unknown Power-Up');const config=normalizedPowerUps(project);if(!boards.normalizedBoards(project).some(b=>b.id===boardId))err('Unknown board');const next=config[boardId]||[];return {...project,powerUps:{...config,[boardId]:next.includes(id)?next.filter(x=>x!==id):[...next,id]}}}
const SEG=/^[a-zA-Z0-9_.-]{1,100}$/;
function parseGithubUrl(value){
 const raw=String(value||'').trim();if(raw.length>500)err('GitHub URL too long');
 let url;try{url=new URL(raw)}catch{err('Enter a GitHub issue, PR, commit or branch URL')}
 if(url.protocol!=='https:'||url.hostname!=='github.com'||url.username||url.password||url.port||url.search||url.hash)err('Use a clean https://github.com/ link');
 const parts=url.pathname.replace(/\/$/,'').split('/').filter(Boolean);
 if(parts.length<4||!SEG.test(parts[0])||!SEG.test(parts[1]))err('GitHub link needs owner, repository and resource');
 const [owner,repo,kind,...rest]=parts; let type,ref;
 if(kind==='issues'&&rest.length===1&&/^[1-9]\d{0,9}$/.test(rest[0])){type='issue';ref=rest[0]}
 else if(kind==='pull'&&rest.length===1&&/^[1-9]\d{0,9}$/.test(rest[0])){type='pull';ref=rest[0]}
 else if(kind==='commit'&&rest.length===1&&/^[0-9a-f]{7,64}$/i.test(rest[0])){type='commit';ref=rest[0].toLowerCase()}
 else if(kind==='tree'&&rest.length>0&&rest.every(x=>SEG.test(x))){type='branch';ref=rest.join('/')}
 else err('Link a GitHub issue, pull request, commit or branch');
 const canonical=`https://github.com/${owner}/${repo}/${kind}/${rest.join('/')}`;
 return {type,owner,repo,ref,url:canonical};
}
function normalizeLink(entry){const source=typeof entry==='string'?{url:entry}:entry||{};const parsed=parseGithubUrl(source.url);return {...parsed,title:String(source.title||'').slice(0,180),state:['open','closed','merged'].includes(source.state)?source.state:'',author:String(source.author||'').slice(0,70),labels:Array.isArray(source.labels)?source.labels.slice(0,8).map(x=>String(x).slice(0,40)):[],commentsCount:Number.isSafeInteger(source.commentsCount)&&source.commentsCount>=0?Math.min(99999,source.commentsCount):0,lastChecked:typeof source.lastChecked==='string'?source.lastChecked.slice(0,35):''}}
function normalizeTaskLinks(value){if(value==null)return [];if(!Array.isArray(value)||value.length>30)err('Too many GitHub links');const links=value.map(normalizeLink);if(new Set(links.map(x=>x.url)).size!==links.length)err('Duplicate GitHub link');return links}
function addLink(project,taskId,rawUrl){const task=project.tasks.find(t=>t.id===taskId);if(!task)err('Task not found');if(!enabled(project,boards.effectiveBoard(task),'github'))err('Enable the GitHub Power-Up on this board first');const link=normalizeLink({url:rawUrl});const current=normalizeTaskLinks(task.githubLinks);if(current.some(x=>x.url===link.url))err('GitHub link already attached');if(current.length>=30)err('Maximum 30 GitHub references per task');return {...project,tasks:project.tasks.map(t=>t.id===taskId?{...t,githubLinks:[...current,link],updatedAt:new Date().toISOString()}:t)};}
function removeLink(project,taskId,rawUrl){const task=project.tasks.find(t=>t.id===taskId);if(!task)err('Task not found');const current=normalizeTaskLinks(task.githubLinks);if(!current.some(x=>x.url===rawUrl))err('GitHub link not found');return {...project,tasks:project.tasks.map(t=>t.id===taskId?{...t,githubLinks:current.filter(x=>x.url!==rawUrl),updatedAt:new Date().toISOString()}:t)};}
function setPreview(project,taskId,rawUrl,preview){const task=project.tasks.find(t=>t.id===taskId);if(!task)err('Task not found');const current=normalizeTaskLinks(task.githubLinks);if(!current.some(x=>x.url===rawUrl))err('GitHub link not found');const next={...project,tasks:project.tasks.map(t=>t.id===taskId?{...t,githubLinks:current.map(l=>l.url===rawUrl?{...l,title:String(preview.title||'').slice(0,180),state:['open','closed','merged'].includes(preview.state)?preview.state:'',author:String(preview.author||'').slice(0,70),labels:Array.isArray(preview.labels)?preview.labels.slice(0,8).map(x=>String(x).slice(0,40)):[],commentsCount:Number.isSafeInteger(preview.commentsCount)&&preview.commentsCount>=0?Math.min(99999,preview.commentsCount):0,lastChecked:new Date().toISOString()}:l)}:t)};return next;}
function endpoint(link){const o=encodeURIComponent(link.owner),r=encodeURIComponent(link.repo);const base=`https://api.github.com/repos/${o}/${r}`;
 if(link.type==='issue')return `${base}/issues/${link.ref}`;
 if(link.type==='pull')return `${base}/pulls/${link.ref}`;
 if(link.type==='commit')return `${base}/commits/${link.ref}`;
 return `${base}/branches/${link.ref.split('/').map(encodeURIComponent).join('/')}`;
}
async function fetchPublicPreview(link,fetchFn){const fetcher=fetchFn||fetch;if(typeof fetcher!=='function')err('Network access unavailable');const response=await fetcher(endpoint(link),{headers:{Accept:'application/vnd.github+json'}});if(!response.ok){if(response.status===403||response.status===429)err('GitHub public API rate limit reached. Try later.');if(response.status===404)err('Not found or private repository. Private access requires authorization.');err(`GitHub public API returned ${response.status}`)}const obj=await response.json();if(!obj||typeof obj!=='object')err('Invalid GitHub response');let title='',state='';if(link.type==='issue'||link.type==='pull'){title=String(obj.title||'');state=obj.merged_at?'merged':obj.state==='closed'?'closed':obj.state==='open'?'open':''}else if(link.type==='commit')title=String(obj.commit?.message||'').split('\n')[0];else title=String(obj.name||link.ref);return {title:title.slice(0,180),state,author:String(obj.user?.login||'').slice(0,70),labels:Array.isArray(obj.labels)?obj.labels.slice(0,8).map(l=>String(l.name||'').slice(0,40)):[],commentsCount:Number.isSafeInteger(obj.comments)?Math.max(0,obj.comments):0};}
function dueSoon(project,boardId,today=localDay(),days=30){const end=new Date(today+'T12:00:00Z');end.setUTCDate(end.getUTCDate()+days);const until=end.toISOString().slice(0,10);return boards.tasksForBoard(project,boardId).filter(t=>t.status!=='Done'&&t.due&&t.due>=today&&t.due<=until).sort((a,b)=>a.due.localeCompare(b.due)||a.position-b.position).slice(0,30)}
function ageInDays(task,today=new Date()){const d=new Date(task.updatedAt||task.createdAt);if(!Number.isFinite(d.getTime()))return 0;return Math.max(0,Math.floor((today.getTime()-d.getTime())/86400000))}
module.exports={CATALOG,normalizedPowerUps,enabled,toggle,parseGithubUrl,normalizeLink,normalizeTaskLinks,addLink,removeLink,setPreview,endpoint,fetchPublicPreview,dueSoon,ageInDays};
