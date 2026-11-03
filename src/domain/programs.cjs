// /src/domain/programs.cjs
'use strict';
// Programs coordinate projects without duplicating their records. Everything is
// stored in the existing workspace; legacy workspaces normalize to [].
const STATES=['Planned','Active','Completed'];
function normalized(items=[],projects=[],portfolios=[]){
 if(!Array.isArray(items)||items.length>50)throw Error('Invalid programs list');
 const ids=new Set(projects.map(p=>p.id)),portfolioIds=new Set(portfolios.map(p=>p.id)),seen=new Set();
 return items.map(raw=>{
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Invalid program');
  const id=String(raw.id||'').slice(0,120);
  if(!id||seen.has(id))throw Error('Missing or duplicate program ID');seen.add(id);
  const name=String(raw.name||'').trim().slice(0,140);
  if(!name)throw Error('Program name required');
  const projectIds=[...new Set((Array.isArray(raw.projectIds)?raw.projectIds:[]).filter(id=>ids.has(id)))].slice(0,30);
  const status=STATES.includes(raw.status)?raw.status:'Planned';
  const memberPortfolioIds=[...new Set((Array.isArray(raw.portfolioIds)?raw.portfolioIds:[]).filter(pid=>portfolioIds.has(pid)))].slice(0,30);
  return {id,name,description:String(raw.description||'').slice(0,1500),status,projectIds,portfolioIds:memberPortfolioIds,manager:String(raw.manager||'').slice(0,150),sponsor:String(raw.sponsor||'').slice(0,150),phase:['Definition','Delivery','Closure'].includes(raw.phase)?raw.phase:'Definition',start:String(raw.start||'').slice(0,10),end:String(raw.end||'').slice(0,10),objective:String(raw.objective||'').slice(0,3000),governance:String(raw.governance||'').slice(0,3000),benefits:(Array.isArray(raw.benefits)?raw.benefits:[]).slice(0,100).map((b,index)=>({id:String(b.id||'').slice(0,120)||'benefit-'+index,benefit:String(b.benefit||'').slice(0,500),target:String(b.target||'').slice(0,300),owner:String(b.owner||'').slice(0,120),status:['Planned','Realising','Realised'].includes(b.status)?b.status:'Planned'}))};
 });
}
function save(ws,input){
 const name=String(input?.name||'').trim().slice(0,140);if(!name)throw Error('Program name required');
 const id=String(input?.id||'').slice(0,120)||'program-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
 const item={id,name,description:input.description||'',status:input.status||'Planned',projectIds:input.projectIds||[],portfolioIds:input.portfolioIds||[],manager:input.manager||'',sponsor:input.sponsor||'',phase:input.phase||'Definition',start:input.start||'',end:input.end||'',objective:input.objective||'',governance:input.governance||'',benefits:input.benefits||[]};
 if(!STATES.includes(item.status))throw Error('Invalid program status');
 if(!Array.isArray(item.projectIds)||item.projectIds.some(pid=>!ws.projects.some(p=>p.id===pid)))throw Error('Unknown project in program');
 if(!Array.isArray(item.portfolioIds)||item.portfolioIds.some(pid=>!ws.portfolios?.some(p=>p.id===pid)))throw Error('Unknown portfolio in program');
 // A portfolio may be governed by one program only; do not silently mutate older associations.
 const allProjects=program=>{const unique=new Set(program.projectIds||[]);for(const portfolio of ws.portfolios||[])if((program.portfolioIds||[]).includes(portfolio.id))for(const project of portfolio.projectIds||[])unique.add(project);return unique};
 const nextProjects=allProjects(item);
 for(const other of ws.programs||[]){
  if(other.id===id)continue;
  if(item.portfolioIds.some(pid=>(other.portfolioIds||[]).includes(pid)))throw Error('Portfolio already belongs to another program');
  const oldProjects=allProjects(other);if([...nextProjects].some(pid=>oldProjects.has(pid)))throw Error('Project already belongs to another program');
 }
 return {...ws,programs:normalized([...(ws.programs||[]).filter(p=>p.id!==id),item],ws.projects,ws.portfolios||[])};
}
function remove(ws,id){if(!ws.programs?.some(p=>p.id===id))throw Error('Program not found');return {...ws,programs:ws.programs.filter(p=>p.id!==id)}}
function prune(ws,id){return {...ws,programs:(ws.programs||[]).map(p=>({...p,projectIds:p.projectIds.filter(x=>x!==id)}))}}
module.exports={STATES,normalized,save,remove,prune};
