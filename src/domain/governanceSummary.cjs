// /src/domain/governanceSummary.cjs
'use strict';
const model=require('./model.cjs');
const {progressOf}=require('../utils/progress.cjs');
const leafTasks=p=>{const tasks=p.tasks||[],parents=new Set(tasks.map(t=>t.parentId).filter(Boolean));return tasks.filter(t=>!parents.has(t.id));};
// Cached per project object: a project is replaced, never edited in place, so the totals stay valid until it changes.
const metricCache=new WeakMap();
function projectMetric(p){let m=metricCache.get(p);if(!m){m=computeMetric(p);metricCache.set(p,m);}return m;}
function computeMetric(p){
 const c=model.operations.costSummary(p),g=p.governance||{},leaves=leafTasks(p),done=leaves.filter(t=>t.status==='Done').length;
 const lines=g.budget?.lines||[];
 const expenses=lines.reduce((n,l)=>n+Number(l.actual||0),0);
 const plannedExtra=lines.reduce((n,l)=>n+Number(l.planned||0),0);
 const risks=(g.risks||[]).filter(r=>r.status!=='Closed'&&r.type!=='Opportunity');
 const docs=Object.values(g.docs||{});
 return {id:p.id,name:p.name,progress:progressOf(p.tasks),tasks:leaves.length,done,health:g.info?.health||p.projectStatus||'On track',budget:c.budget,planned:c.plannedCost+plannedExtra,spent:c.cost+expenses,currency:c.currency,approvedDocs:docs.filter(d=>d.status==='Approved').length,risks,phase:g.info?.phase||'Initiating',start:g.info?.start||leaves.map(x=>x.start).filter(Boolean).sort()[0]||'',end:g.info?.end||leaves.map(x=>x.due).filter(Boolean).sort().at(-1)||''};
}
function aggregate(workspace,ids){const distinct=new Set(ids||[]),list=(workspace.projects||[]).filter(p=>distinct.has(p.id)).map(projectMetric);const weight=list.reduce((n,p)=>n+p.tasks,0);const done=list.reduce((n,p)=>n+p.done,0);const budget=list.reduce((n,p)=>n+p.budget,0),spent=list.reduce((n,p)=>n+p.spent,0);const severity={'On track':0,'At risk':1,'Off track':2,'On hold':2};const health=list.reduce((a,p)=>(severity[p.health]||0)>(severity[a]||0)?p.health:a,'On track');return {list,progress:weight?list.reduce((n,p)=>n+p.progress*p.tasks,0)/weight:0,done,tasks:weight,budget,spent,health,risks:list.flatMap(p=>p.risks.map(r=>({...r,project:p.name,projectId:p.id}))).sort((a,b)=>(b.prob*b.impact)-(a.prob*a.impact))};}
function portfolioMetric(workspace,portfolio){return aggregate(workspace,portfolio.projectIds||[])}
function programMetric(workspace,program){const portfolioIds=new Set(program.portfolioIds||[]),ids=new Set(program.projectIds||[]);(workspace.portfolios||[]).filter(p=>portfolioIds.has(p.id)).forEach(p=>(p.projectIds||[]).forEach(id=>ids.add(id)));return aggregate(workspace,[...ids])}
module.exports={projectMetric,aggregate,portfolioMetric,programMetric};
