// /src/components/inline/CompactTools.js
import {useState} from 'react';
import {Platform,Pressable,View} from 'react-native';
import {Feather} from '@expo/vector-icons';
import { Input, T, Button, Chip, Sheet, ConfirmSheet } from '../../ui/ui';
import Reveal from '../../ui/Reveal';
import { useTheme } from '../../ui/theme/theme';
import DisclosureGlyph from './DisclosureGlyph';
import MarkdownField from './MarkdownField';

// Disclosure is part of the modern layout. Unlike the former ClassicApp,
// it does not instantiate a second store or application shell.
// open/onToggle (optional): lets the parent open the fold, e.g. an Edit button that fills a form inside it.
export function Fold({title,subtitle,children,initial=false,actions,open,onToggle}){
 const [inner,setInner]=useState(initial);const {c}=useTheme();
 const expanded=open===undefined?inner:open,setExpanded=v=>{setInner(v);onToggle&&onToggle(v)};
 const Body=initial?View:Reveal;
 return <View style={{gap:expanded?16:0,borderRadius:16,backgroundColor:c.surface,borderWidth:1,borderColor:c.line,padding:16}}>
  <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{expanded}} onPress={()=>setExpanded(!expanded)} style={{minHeight:48,flexDirection:'row',alignItems:'center',gap:12}}>
   <View style={{flex:1,gap:3}}><T weight="600" size={16}>{title}</T>{subtitle?<T muted size={12} numberOfLines={expanded?undefined:2}>{subtitle}</T>:null}</View>
   <DisclosureGlyph expanded={expanded} color={c.muted}/>
  </Pressable>
  {expanded?<Body style={{gap:16,paddingTop:12,borderTopWidth:1,borderColor:c.line}}>{children}{actions}</Body>:null}
 </View>;
}
export function EditRow({title,summary,children,initial=false}){
 const [open,setOpen]=useState(initial);const {c}=useTheme();return <View style={{borderTopWidth:1,borderColor:c.line,paddingTop:8}}>
  <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={()=>setOpen(!open)} style={{flexDirection:'row',alignItems:'center',minHeight:Platform.OS==='android'?48:44,gap:10}} accessibilityState={{expanded:open}}>
   <View style={{flex:1,gap:2}}><T size={13} weight="600">{title}</T>{summary?<T size={12} muted numberOfLines={1}>{summary}</T>:null}</View>
   <Feather name={open?'chevron-up':'chevron-down'} size={17} color={c.muted}/>
  </Pressable>{open?<Reveal style={{gap:12,paddingBottom:16,paddingTop:8}}>{children}</Reveal>:null}
 </View>;
}
export function Labeled({title,value,onChange,placeholder,keyboardType,multiline,markdown=false,autoFocus=false}){return markdown?<MarkdownField label={title} value={String(value??'')} onChangeText={onChange} placeholder={placeholder}/>:<View style={{gap:6}}><T muted size={12} weight="500">{title}</T><Input accessibilityLabel={title} value={String(value??'')} onChangeText={onChange} placeholder={placeholder} keyboardType={keyboardType} multiline={multiline} autoFocus={autoFocus}/></View>}
export function Pick({values,value,onChange}){return <View style={{flexDirection:'row',flexWrap:'wrap',gap:7}}>{values.map(v=><Chip key={typeof v==='string'?v:v.value} label={typeof v==='string'?v:v.label} active={value===(typeof v==='string'?v:v.value)} onPress={()=>onChange(typeof v==='string'?v:v.value)}/>)}</View>}
export function DangerConfirm({label,onConfirm}){
 const[armed,setArmed]=useState(false);
 return <><Button label={label} variant="ghost" onPress={()=>setArmed(true)}/>
  {armed?<ConfirmSheet visible title={label} confirmLabel={`Confirm ${label.toLowerCase()}`} danger
   description={`Review this change before continuing. ${label.toLowerCase().includes('delete')?'The selected record will be removed.':''}`}
   onConfirm={onConfirm} onClose={()=>setArmed(false)}/>:null}</>;
}

// A closed field that opens a list of choices. options: [{value,label}].
export function Dropdown({options,value,onChange,title='Choose an option'}){
 const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[limit,setLimit]=useState(60);
 const {c}=useTheme();const cur=options.find(o=>o.value===value);
 const filtered=options.filter(o=>String(o.label).toLowerCase().includes(query.toLowerCase()));
 return <>
  <Pressable accessibilityRole="button" accessibilityLabel={title==='Choose an option'?(cur?cur.label:title):`${title}: ${cur?.label||'Choose'}`}  accessibilityState={{expanded:open}}
   onPress={()=>setOpen(true)} style={({pressed})=>({minHeight:48,paddingHorizontal:14,paddingVertical:12,borderRadius:12,borderWidth:1,borderColor:c.line,backgroundColor:pressed?c.selection:c.surfaceAlt,flexDirection:'row',alignItems:'center',gap:12})}>
   <T size={14} style={{flex:1}} numberOfLines={1}>{cur?cur.label:'Choose an option'}</T><Feather name="chevron-down" size={18} color={c.muted}/>
  </Pressable>
  {open?<Sheet visible compact title={title} showNotice={false} onClose={()=>{setOpen(false);setQuery('');setLimit(60);}}>
   {options.length>6?<Input value={query} onChangeText={text=>{setQuery(text);setLimit(60);}} placeholder="Find an option" accessibilityLabel="Find an option"/>:null}
   {filtered.slice(0,limit).map(o=><Pressable key={o.value} accessibilityRole="radio" accessibilityLabel={o.label} accessibilityState={{checked:o.value===value}}
    onPress={()=>{onChange(o.value);setOpen(false);setQuery('');setLimit(60);}}
    style={({pressed})=>({minHeight:48,padding:12,borderRadius:12,backgroundColor:o.value===value?c.selection:pressed?c.surfaceAlt:'transparent',flexDirection:'row',alignItems:'center',gap:12})}>
     <T size={14} style={{flex:1}}>{o.label}</T>{o.value===value?<Feather name="check" size={18} color={c.accentText}/>:null}
   </Pressable>)}
   {!filtered.length?<T muted>No options match this search.</T>:null}
   {filtered.length>limit?<Button label="Show more options" variant="secondary" onPress={()=>setLimit(n=>n+60)}/>:null}
  </Sheet>:null}
 </>;
}
