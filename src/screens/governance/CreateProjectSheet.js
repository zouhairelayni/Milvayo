// /src/screens/governance/CreateProjectSheet.js
import { useState } from 'react';
import { Button, Sheet } from '../../ui/ui';
import { Labeled } from '../../components/inline/CompactTools';
import { useStore } from '../../store/store';

export default function CreateProjectSheet({ visible, onClose, onCreated }) {
  const { createProject } = useStore();
  const [name,setName]=useState(''),[code,setCode]=useState(''),[description,setDescription]=useState('');
  const [manager,setManager]=useState(''),[sponsor,setSponsor]=useState(''),[objective,setObjective]=useState('');
  const close=()=>{setName('');setCode('');setDescription('');setManager('');setSponsor('');setObjective('');onClose();};
  const save=()=>{
    if(!name.trim()||name.trim().length>180||code.trim().length>30)return;
    const id=createProject({name,code,description,manager,sponsor,objective});
    if(id){close();onCreated?.(id);}
  };
  return <Sheet visible={visible} onClose={close} title="Create project" showNotice={false}
    footer={<><Button label="Cancel" variant="ghost" small onPress={close}/><Button label="Create project" small disabled={!name.trim()||name.trim().length>180||code.trim().length>30} onPress={save}/></>}>
    <Labeled title="Project name" value={name} onChange={setName} autoFocus placeholder="Project name"/>
    <Labeled title="Project code (optional)" value={code} onChange={setCode} placeholder="Automatically generated if blank"/>
    <Labeled title="Description" value={description} onChange={setDescription} markdown placeholder="Purpose and scope"/>
    <Labeled title="Project manager" value={manager} onChange={setManager} placeholder="Name"/>
    <Labeled title="Sponsor" value={sponsor} onChange={setSponsor} placeholder="Name or organization"/>
    <Labeled title="Objective" value={objective} onChange={setObjective} multiline placeholder="Desired result"/>
  </Sheet>;
}
