import React,{useState} from 'react';
import {View,Text,TextInput,Pressable,ScrollView,Modal,useWindowDimensions} from 'react-native';
import {SafeAreaProvider,SafeAreaView} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import design from './design.cjs';
import schema from './taskSchema.cjs';
const C=design.colors;
const S=s=>({color:C.ink,fontSize:13,lineHeight:19,...s});
function Label({children,muted=false,style}){return <Text style={S({color:muted?C.muted:C.ink,...style})}>{children}</Text>}
function Button({title,onPress,active=false,destructive=false}){return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({pressed})=>({minHeight:44,justifyContent:'center',alignItems:'center',paddingHorizontal:14,backgroundColor:active?C.purpleDim:C.panel2,borderColor:destructive?C.red:active?C.purple:C.border,borderWidth:1,borderRadius:8,opacity:pressed?.7:1})}><Text style={S({color:destructive?C.red:active?C.purple:C.ink,fontWeight:'600'})}>{title}</Text></Pressable>}
function FieldInput({title,value,onChange,placeholder}){return <View style={{gap:6,marginBottom:12}}><Label muted>{title}</Label><TextInput accessibilityLabel={title} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={C.muted} autoCapitalize="none" style={{height:44,borderRadius:8,borderWidth:1,borderColor:C.border,backgroundColor:C.bg,color:C.ink,paddingHorizontal:12}}/></View>}
function Section({title,subtitle,children}){return <View style={{padding:16,backgroundColor:C.panel,borderWidth:1,borderColor:C.border,borderRadius:12,gap:12,marginBottom:16}}><Text style={S({fontWeight:'700',fontSize:16})}>{title}</Text>{subtitle&&<Label muted>{subtitle}</Label>}{children}</View>}
export default function TaskConfigurationPanel({visible,onClose,project,onApply}){
 const {width}=useWindowDimensions();
 const [typeName,setTypeName]=useState(''),[typeId,setTypeId]=useState('');
 const [fieldName,setFieldName]=useState(''),[fieldId,setFieldId]=useState(''),[fieldType,setFieldType]=useState('text'),[options,setOptions]=useState('');
 const [from,setFrom]=useState('Backlog'),[to,setTo]=useState('In progress'),[ruleType,setRuleType]=useState('');
 const addType=()=>{const id=typeId.trim()||typeName.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');onApply(p=>schema.updateSchema(p,{taskTypes:[...p.taskTypes,{id,name:typeName}]}),'Created task type');setTypeName('');setTypeId('')};
 const addField=()=>{const id=fieldId.trim()||fieldName.trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');onApply(p=>schema.updateSchema(p,{customFields:[...p.customFields,{id,name:fieldName,type:fieldType,options:options.split(',').map(x=>x.trim()).filter(Boolean)}]}),'Created custom field');setFieldId('');setFieldName('');setOptions('')};
 const addTransition=()=>onApply(p=>schema.updateSchema(p,{workflow:{...p.workflow,transitions:[...p.workflow.transitions,{from,to,typeId:ruleType}]}}),'Added workflow transition');
 return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
  <SafeAreaProvider style={{flex:1}}><SafeAreaView edges={['top','bottom','left','right']} style={{flex:1,backgroundColor:'#000b',alignItems:'center',justifyContent:'center'}}>
   <View style={{width:'100%',maxWidth:width>=700?740:undefined,maxHeight:'100%',flex:1,backgroundColor:C.bg}}>
    <View style={{padding:16,borderBottomWidth:1,borderColor:C.border,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}}><View style={{flex:1}}><Label style={{fontWeight:'700',fontSize:18}}>Task configuration</Label><Label muted>Per-project settings · {project.name}</Label></View><Button title="Done" onPress={onClose}/></View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:16,paddingBottom:40}}>
     <Section title="Task types" subtitle="Organize work by purpose. Types are labels, not hardcoded screens.">
      {project.taskTypes.map(t=><View key={t.id} style={{flexDirection:'row',gap:12,alignItems:'center',justifyContent:'space-between',minHeight:44}}><View style={{flex:1}}><Label>{t.name}</Label><Label muted>{t.id}</Label></View>{t.id!=='task'&&<Button title="Remove" destructive onPress={()=>onApply(p=>schema.removeType(p,t.id),'Removed task type',true)}/>}</View>)}
      <FieldInput title="New type name" value={typeName} onChange={setTypeName} placeholder="e.g. Risk, Requirement"/><FieldInput title="Type ID (optional)" value={typeId} onChange={setTypeId} placeholder="lowercase-key"/>
      <Button title="Add task type" active onPress={addType}/>
     </Section>
     <Section title="Custom fields" subtitle="Field values are validated before storage, and included in JSON backups.">
      {project.customFields.map(f=><View key={f.id} style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:10,minHeight:44}}><View style={{flex:1}}><Label>{f.name}</Label><Label muted>{f.type}{f.required?' · required':''} · {f.id}</Label></View><Button title="Remove" destructive onPress={()=>onApply(p=>schema.removeField(p,f.id),'Removed custom field',true)}/></View>)}
      <FieldInput title="New field name" value={fieldName} onChange={setFieldName} placeholder="e.g. Story points"/><FieldInput title="Field ID (optional)" value={fieldId} onChange={setFieldId} placeholder="story-points"/>
      <Label muted>Field type</Label><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{schema.TYPES.map(t=><Button key={t} title={t} active={fieldType===t} onPress={()=>setFieldType(t)}/>)}</View>
      {fieldType==='select'&&<FieldInput title="Allowed options (comma-separated)" value={options} onChange={setOptions} placeholder="Small, Medium, Large"/>}
      <Button title="Add custom field" active onPress={addField}/>
     </Section>
     <Section title="Status workflow" subtitle="Disabled by default. Enabling restricts moves to the defined paths; Kanban and bulk edits share the same rules.">
      <View style={{flexDirection:'row',gap:8,alignItems:'center',justifyContent:'space-between'}}><Label>Enforce transitions</Label><Button title={project.workflow.enabled?'Enabled':'Disabled'} active={project.workflow.enabled} onPress={()=>onApply(p=>schema.updateSchema(p,{workflow:{...p.workflow,enabled:!p.workflow.enabled}}),'Updated workflow enforcement')}/></View>
      {project.workflow.transitions.map((t,i)=><View key={`${t.from}-${t.to}-${t.typeId}-${i}`} style={{flexDirection:'row',gap:8,alignItems:'center',justifyContent:'space-between'}}><View style={{flex:1}}><Label>{t.from} → {t.to}</Label><Label muted>{t.typeId||'All types'}</Label></View><Button title="Remove" destructive onPress={()=>onApply(p=>schema.updateSchema(p,{workflow:{...p.workflow,transitions:p.workflow.transitions.filter((_,n)=>n!==i)}}),'Removed workflow transition')}/></View>)}
      <Label muted>From status</Label><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{schema.STATUSES.map(s=><Button key={s} title={s} active={from===s} onPress={()=>setFrom(s)}/>)}</View>
      <Label muted>To status</Label><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{schema.STATUSES.map(s=><Button key={s} title={s} active={to===s} onPress={()=>setTo(s)}/>)}</View>
      <Label muted>Applies to</Label><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}><Button title="All types" active={!ruleType} onPress={()=>setRuleType('')}/>{project.taskTypes.map(t=><Button key={t.id} title={t.name} active={ruleType===t.id} onPress={()=>setRuleType(t.id)}/>)}</View><Button title="Add allowed transition" active onPress={addTransition}/>
     </Section>
    </ScrollView>
   </View>
  </SafeAreaView></SafeAreaProvider>
 </Modal>;
}
