// /src/ui/InlineCalendar.js
import {useEffect,useState} from 'react';
import {Pressable,View} from 'react-native';
import {Feather} from '@expo/vector-icons';
import {T} from './uiBase';
import {Button,IconBtn,Input} from './uiControls';
import {useTheme} from './theme/theme';
import Reveal from './Reveal';
import PressSurface from './PressSurface';
import {localDay} from '../utils/localDay.cjs';
const{monthCells,parseDay,validDay,validMonth,shiftMonth}=require('../domain/calendar.cjs');

export function InlineCalendar({value,onChange,rangeStart,rangeEnd,marks={},selectedDates=[],label='Calendar',min,max}){
 const{c}=useTheme(),today=localDay();const[month,setMonth]=useState(()=>validDay(value)?value.slice(0,7):today.slice(0,7));
 useEffect(()=>{if(validDay(value))setMonth(value.slice(0,7));},[value]);
 const cells=monthCells(month),title=parseDay(month+'-01')?.toLocaleDateString('en',{month:'long',year:'numeric',timeZone:'UTC'});
 return <View accessibilityLabel={label} style={{gap:12}}>
  <View style={{flexDirection:'row',alignItems:'center',gap:8}}><T size={18} weight="600" accessibilityRole="header" style={{flex:1}}>{title}</T>
   <IconBtn icon="chevron-left" label={`Previous month in ${label}`} onPress={()=>setMonth(m=>shiftMonth(m,-1))}/><IconBtn icon="chevron-right" label={`Next month in ${label}`} onPress={()=>setMonth(m=>shiftMonth(m,1))}/>
  </View>
  <View style={{flexDirection:'row'}}>{['M','T','W','T','F','S','S'].map((d,i)=><T key={i} size={11} muted center style={{flex:1,paddingVertical:8}}>{d}</T>)}</View>
  <Reveal key={month} distance={4} duration={180} style={{gap:4}}>
   {Array.from({length:6},(_,row)=><View key={row} style={{flexDirection:'row',gap:2}}>{cells.slice(row*7,row*7+7).map((d,col)=>{
    const disabled=!d||(validDay(min)&&d.iso<min)||(validDay(max)&&d.iso>max),selected=d&&(d.iso===value||selectedDates.includes(d.iso)),inRange=d&&validDay(rangeStart)&&validDay(rangeEnd)&&d.iso>rangeStart&&d.iso<rangeEnd;
    return <View key={d?.iso||col} style={{flex:1,minWidth:0,backgroundColor:inRange?c.selection:'transparent',borderRadius:inRange?0:12}}>{d?<PressSurface disabled={disabled} accessibilityRole="button" accessibilityLabel={`${d.iso}${marks[d.iso]?`, ${marks[d.iso]} tasks`:''}`} accessibilityState={{selected:!!selected,disabled:!!disabled}} onPress={()=>onChange(d.iso)}
     containerStyle={{width:'100%'}} style={{minHeight:44,borderRadius:12,alignItems:'center',justifyContent:'center',gap:3,backgroundColor:selected?c.ink:'transparent',borderWidth:!selected&&(d.iso===today||d.iso===rangeStart||d.iso===rangeEnd)?1:0,borderColor:d.iso===rangeStart||d.iso===rangeEnd?c.accent:c.line,opacity:d.inMonth?1:.45}}>
     <T size={14} weight={selected?'600':'400'} color={selected?c.bg:c.ink}>{d.day}</T><View style={{width:3,height:3,borderRadius:2,backgroundColor:marks[d.iso]?(selected?c.bg:c.accent):'transparent'}}/>
    </PressSurface>:<View style={{minHeight:44}}/>}</View>;
   })}</View>)}
  </Reveal>
  <View style={{flexDirection:'row',gap:8,justifyContent:'space-between',alignItems:'center'}}><Button label="Today" variant="ghost" onPress={()=>{setMonth(today.slice(0,7));if((!validDay(min)||today>=min)&&(!validDay(max)||today<=max))onChange(today)}}/>{value?<T size={12} muted>{value}</T>:null}</View>
 </View>;
}
export function InlineDateField({label='Date',value,onChange,allowEmpty=true,initialOpen=false,min,max}){
 const{c}=useTheme();const[open,setOpen]=useState(initialOpen),[typed,setTyped]=useState(false),[draft,setDraft]=useState(value||'');
 useEffect(()=>setDraft(value||''),[value]);
 return <View style={{gap:10,width:'100%'}}>
  <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${value||'Not set'}`} accessibilityState={{expanded:open}} onPress={()=>setOpen(v=>!v)} style={{minHeight:50,flexDirection:'row',alignItems:'center',gap:12,padding:12,borderRadius:12,borderWidth:1,borderColor:c.line,backgroundColor:c.surface}}>
   <Feather name="calendar" size={17} color={c.muted}/><View style={{flex:1,gap:3}}><T size={11} muted>{label}</T><T size={14} weight="500">{value||'Choose a date'}</T></View><Feather name={open?'chevron-up':'chevron-down'} size={16} color={c.muted}/>
  </Pressable>
  {open?<Reveal style={{gap:12}}><InlineCalendar label={label} value={value} onChange={onChange} min={min} max={max}/>
   <View style={{flexDirection:'row',justifyContent:'space-between',gap:8}}>{allowEmpty?<Button label="Clear date" variant="ghost" onPress={()=>onChange('')}/>:null}<Button label={typed?'Hide typing':'Type a date'} variant="ghost" onPress={()=>setTyped(v=>!v)}/></View>
   {typed?<><Input value={draft} accessibilityLabel={`Type ${label}`} placeholder="YYYY-MM-DD" onChangeText={v=>{setDraft(v);if(validDay(v)||allowEmpty&&v==='')onChange(v)}}/>{draft&&!validDay(draft)?<T size={12} color={c.danger}>Use a real date in YYYY-MM-DD format.</T>:null}</>:null}
  </Reveal>:null}
 </View>;
}
export function InlineDateRange({start,end,onStart,onEnd,startLabel='Start',endLabel='Due'}){
 const{c}=useTheme();const[edge,setEdge]=useState('start');const value=edge==='start'?start:end;
 return <View style={{gap:16,width:'100%'}}><View style={{flexDirection:'row',gap:8}}>{[['start',startLabel,start],['end',endLabel,end]].map(([id,label,date])=><Pressable key={id} accessibilityRole="button" accessibilityLabel={`Pick ${label}`} accessibilityState={{selected:edge===id}} onPress={()=>setEdge(id)} style={{flex:1,minHeight:64,padding:12,borderRadius:12,borderWidth:1,borderColor:edge===id?c.ink:c.line,backgroundColor:c.surface,gap:5}}><T size={11} muted>{label}</T><T size={14} weight="500">{date||'Not set'}</T></Pressable>)}</View>
  <InlineCalendar label={`${startLabel} / ${endLabel}`} value={value} rangeStart={start} rangeEnd={end} onChange={date=>{if(edge==='start'){if(onStart(date)!==false)setEdge('end')}else onEnd(date)}}/>
  <View style={{flexDirection:'row',gap:8}}><Button label={`Clear ${edge==='start'?startLabel:endLabel}`} variant="ghost" onPress={()=>edge==='start'?onStart(''):onEnd('')}/></View>
 </View>;
}
