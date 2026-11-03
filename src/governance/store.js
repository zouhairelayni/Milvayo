// /src/governance/store.js
import {useMemo} from 'react';
import {useStore as useOriginal} from '../store/store';
const model=require('../domain/model.cjs');
export function useStore(){
 const api=useOriginal();const project=api.workspace.projects.find(p=>p.id===api.workspace.selectedId);
 const s=useMemo(()=>({project:{name:project.name,budget:project.budget?.amount||0,release:project.version,due:project.due||''},tasks:project.tasks,contributors:(project.resources||[]).map(x=>({...x,rate:x.hourlyRate})),pm:project.governance,costs:model.operations.costSummary(project)}),[project]);
 const setPm=(key,value,label)=>api.setGovernance(key,value,label);
 const setDocValue=(docKey,sectionKey,value)=>api.setGovernanceDocValue(docKey,sectionKey,value);
 const setDocStatus=(docKey,status)=>api.setGovernanceDocStatus(docKey,status);
 const updateProject=patch=>{if('budget' in patch)return api.setBudget(Number(patch.budget),project.budget?.currency||'USD');return api.updateProject(project.id,patch)};
 return {...api,s,currentId:project.id,setPm,setDocValue,setDocStatus,updateProject};
}
