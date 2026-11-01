import { useState } from 'react';
import { View } from 'react-native';
import { Page, Segmented, T } from '../ui';
import { useStore } from '../store';
import { Projects } from './Projects';
import { Programs } from './Programs';
import Portfolios from './Portfolios';

// One navigation destination; three independent screen modules and one canonical store.
export default function EnterprisePM(){
 const {workspace}=useStore();
 const [section,setSection]=useState('Programs');
 const counts={Programs:(workspace.programs||[]).length,Portfolios:(workspace.portfolios||[]).length,Projects:workspace.projects.length};
 return <Page title="Entreprise PM" subtitle="Programs contain portfolios; portfolios contain projects. Each project keeps its own boards, tasks and history.">
  <View style={{gap:8}}>
   <Segmented options={['Programs','Portfolios','Projects']} value={section} onChange={setSection}/>
   <T muted size={12}>{section}: {counts[section]} · {section==='Programs'?'Coordinate portfolios':section==='Portfolios'?'Organize projects':'Manage individual projects'}</T>
  </View>
  {section==='Programs'?<Programs embedded/>:section==='Portfolios'?<Portfolios embedded/>:<Projects embedded/>}
 </Page>;
}
