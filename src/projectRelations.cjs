'use strict';
/** Shared relationship selectors for the independent Projects, Programs and Portfolios screens.
 * No React dependency, no persistence and no mutation: project data stays in the canonical workspace.
 */
function tasksOf(project){return Array.isArray(project?.tasks)?project.tasks:[];}
function projectSummary(project){
 const tasks=tasksOf(project);
 const doneCount=tasks.filter(t=>t?.status==='Done').length;
 return {taskCount:tasks.length,doneCount,progress:tasks.length?doneCount/tasks.length:0};
}
function linkedProjects(workspace,projectIds){
 const ids=new Set(Array.isArray(projectIds)?projectIds:[]);
 return (Array.isArray(workspace?.projects)?workspace.projects:[]).filter(p=>ids.has(p.id));
}
function programPortfolios(workspace,program){
 const ids=new Set(Array.isArray(program?.portfolioIds)?program.portfolioIds:[]);
 return (workspace?.portfolios||[]).filter(p=>ids.has(p.id));
}
function programSummary(workspace,program){
 const portfolios=programPortfolios(workspace,program);
 // Retain legacy direct projects; a project shared by two portfolios counts once.
 const projectIds=new Set(Array.isArray(program?.projectIds)?program.projectIds:[]);
 portfolios.forEach(p=>(p.projectIds||[]).forEach(id=>projectIds.add(id)));
 const linked=linkedProjects(workspace,[...projectIds]);
 const tasks=linked.flatMap(tasksOf);
 const doneCount=tasks.filter(t=>t?.status==='Done').length;
 return {portfolios,linked,projectCount:linked.length,portfolioCount:portfolios.length,taskCount:tasks.length,doneCount,progress:tasks.length?doneCount/tasks.length:0};
}
function portfolioSummary(workspace,portfolio){
 const linked=linkedProjects(workspace,portfolio?.projectIds);
 return {linked,projectCount:linked.length,projectNames:linked.map(p=>p.name)};
}
function removePortfolioLinks(workspace,portfolioId){
 return {...workspace,programs:(workspace.programs||[]).map(p=>({...p,portfolioIds:(p.portfolioIds||[]).filter(id=>id!==portfolioId)}))};
}
function removeProjectLinks(workspace,projectId){
 const without=id=>id!==projectId;
 return {...workspace,
  programs:(workspace.programs||[]).map(p=>({...p,projectIds:(p.projectIds||[]).filter(without)})),
  portfolios:(workspace.portfolios||[]).map(p=>({...p,projectIds:(p.projectIds||[]).filter(without)}))};
}
module.exports={tasksOf,projectSummary,linkedProjects,programPortfolios,programSummary,portfolioSummary,removeProjectLinks,removePortfolioLinks};
