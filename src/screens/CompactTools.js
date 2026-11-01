import {useState} from 'react';
import {Pressable,View} from 'react-native';
import {Feather} from '@expo/vector-icons';
import {Card,Input,T,Button,Chip,SectionTitle} from '../ui';
import {useTheme} from '../theme';
import DisclosureGlyph from '../DisclosureGlyph';

// Disclosure is part of the modern layout. Unlike the former ClassicApp,
// it does not instantiate a second store or application shell.
export function Fold({title,subtitle,children,initial=false,actions}){
 const [expanded,setExpanded]=useState(initial);const {c}=useTheme();
 return <Card style={{gap:expanded?12:0}}>
  <Pressable accessibilityRole="button" accessibilityState={{expanded}} onPress={()=>setExpanded(!expanded)} style={{minHeight:44,flexDirection:'row',alignItems:'center',gap:12}}>
   <View style={{flex:1,gap:3}}><T weight="600" size={14}>{title}</T>{subtitle?<T muted size={12} numberOfLines={expanded?undefined:2}>{subtitle}</T>:null}</View>
   <DisclosureGlyph expanded={expanded} color={c.muted}/>
  </Pressable>
  {expanded?<View style={{gap:12}}>{children}{actions}</View>:null}
 </Card>;
}
export function EditRow({title,summary,children}){
 const [open,setOpen]=useState(false);const {c}=useTheme();return <View style={{borderTopWidth:1,borderColor:c.line,paddingTop:8}}>
  <Pressable onPress={()=>setOpen(!open)} style={{flexDirection:'row',alignItems:'center',minHeight:42,gap:10}} accessibilityRole="button" accessibilityState={{expanded:open}}>
   <View style={{flex:1,gap:2}}><T size={13} weight="600">{title}</T>{summary?<T size={12} muted numberOfLines={1}>{summary}</T>:null}</View>
   <Feather name={open?'chevron-up':'chevron-down'} size={17} color={c.muted}/>
  </Pressable>{open?<View style={{gap:10,paddingBottom:12}}>{children}</View>:null}
 </View>;
}
export function Labeled({title,value,onChange,placeholder,keyboardType,multiline}){return <View style={{gap:6}}><T muted upper size={11} weight="600">{title}</T><Input value={String(value??'')} onChangeText={onChange} placeholder={placeholder} keyboardType={keyboardType} multiline={multiline}/></View>}
export function Pick({values,value,onChange}){return <View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}>{values.map(v=><Chip key={typeof v==='string'?v:v.value} label={typeof v==='string'?v:v.label} active={value===(typeof v==='string'?v:v.value)} onPress={()=>onChange(typeof v==='string'?v:v.value)}/>)}</View>}
export function DangerConfirm({label,onConfirm}){const[armed,setArmed]=useState(false);return <View style={{gap:8,width:'100%'}}>{armed?<View style={{flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:8,width:'100%'}}><Button label={`Confirm ${label.toLowerCase()}`} small variant="danger" onPress={()=>{onConfirm();setArmed(false)}}/><Button label="Cancel" small variant="ghost" onPress={()=>setArmed(false)}/></View>:<Button label={label} small variant="ghost" onPress={()=>setArmed(true)}/>}</View>}
