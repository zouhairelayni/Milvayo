// /src/screens/governance/CreateProjectSheet.js
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Input, Sheet, T } from '../../ui/ui';
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
    <View style={{gap:6}}><T weight="600">Project name</T><Input autoFocus value={name} onChangeText={setName} placeholder="Project name"/></View>
    <View style={{gap:6}}><T weight="600">Project code (optional)</T><Input value={code} onChangeText={setCode} placeholder="Automatically generated if blank"/></View>
    <View style={{gap:6}}><T weight="600">Description</T><Input multiline value={description} onChangeText={setDescription} placeholder="Purpose and scope"/></View>
    <View style={{gap:6}}><T weight="600">Project manager</T><Input value={manager} onChangeText={setManager}/></View>
    <View style={{gap:6}}><T weight="600">Sponsor</T><Input value={sponsor} onChangeText={setSponsor}/></View>
    <View style={{gap:6}}><T weight="600">Objective</T><Input multiline value={objective} onChangeText={setObjective}/></View>
  </Sheet>;
}
