// /src/components/charts/StudioCharts.js
import {useId,useMemo,useState} from 'react';
import {Pressable,View} from 'react-native';
import Svg,{Circle,Defs,Line,LinearGradient,Path,Rect,Stop,Text as SvgText} from 'react-native-svg';
import {Feather} from '@expo/vector-icons';
import {T} from '../../ui/uiBase';
import {useTheme} from '../../ui/theme/theme';
import EmptyArtwork from '../illustrations/EmptyArtwork';
import TracePath from './TracePath';
import Column from './Column';
import CountValue from '../../ui/CountValue';
const {radialSegments,pointsFor,linePath}=require('../../domain/dashboard.cjs');
const tones=c=>[c.faint,c.accent,'#A6A0E8',c.success];
export function StatusOrbit({series,onStatus,progress=0,caption='weighted progress'}){
 const {c}=useTheme();const values=series.map(s=>s.value),total=values.reduce((n,v)=>n+v,0),segments=radialSegments(values,64,7),colors=tones(c);
 return <View style={{flexDirection:'row',alignItems:'center',gap:20,flexWrap:'wrap'}}>
  <View accessibilityLabel={`${caption} ${Math.round(progress*100)} percent. ${total} total tasks.`} style={{width:172,height:172,alignItems:'center',justifyContent:'center'}}>
   <Svg width={172} height={172} viewBox="0 0 172 172" pointerEvents="none" style={{position:'absolute'}}>
    <Circle cx={86} cy={86} r={64} stroke={c.line} strokeWidth={13} fill="none"/>
    {segments.map((seg,i)=>seg.length>0?<Circle key={i} cx={86} cy={86} r={64} transform="rotate(-90 86 86)" fill="none" stroke={colors[i]} strokeWidth={13} strokeLinecap="round" strokeDasharray={`${seg.length} ${2*Math.PI*64-seg.length}`} strokeDashoffset={-seg.offset}/>:null)}
    <Circle cx={86} cy={86} r={48} stroke={c.line} strokeWidth={1} strokeDasharray="1 7" fill="none"/>
   </Svg>
   <T size={38} weight="600">{Math.round(progress*100)}<T size={17} muted>%</T></T><T size={11} muted>{caption}</T>
  </View>
  <View style={{flex:1,minWidth:112,gap:2}}>{series.map((s,i)=><Pressable key={s.label} accessibilityRole={onStatus?'button':undefined} accessibilityLabel={`${s.label}: ${s.value} tasks`} onPress={()=>onStatus?.(s.label)} disabled={!onStatus} style={({pressed})=>({minHeight:42,flexDirection:'row',alignItems:'center',gap:8,opacity:pressed?.6:1})}>
   <View style={{width:7,height:7,borderRadius:3,backgroundColor:colors[i]}}/><T size={12} muted style={{flex:1}}>{s.label}</T><T size={14} weight="600">{s.value}</T>
  </Pressable>)}</View>
 </View>;
}
export function ScheduleColumns({series,onOpenDate,title='Due schedule'}){
 const {c}=useTheme();const [selected,setSelected]=useState(null);const chosen=series.find(x=>x.date===selected);const max=Math.max(1,...series.map(x=>x.value));
 const [width,setWidth]=useState(320);const height=156,left=4,right=24,top=14,bottom=26,plotH=height-top-bottom,plotW=Math.max(1,width-left-right),slot=plotW/Math.max(1,series.length);
 return <View style={{gap:16}}>
  <View style={{flexDirection:'row',alignItems:'center',gap:12}}><View style={{flex:1,gap:4}}><T size={16} weight="600">{title}</T><T size={12} muted>{chosen?`${chosen.date} · ${chosen.value} due · ${chosen.done} done`:'Tasks due over the next seven days'}</T></View><CountValue value={series.reduce((n,x)=>n+x.value,0)} size={28}/></View>
  <View onLayout={e=>{const w=e.nativeEvent.layout.width;if(w>0)setWidth(w);}} style={{height,width:'100%'}}>
   <Svg width={width} height={height} pointerEvents="none">
    {[0,.5,1].map(n=><Line key={n} x1={left} x2={width-right} y1={top+n*plotH} y2={top+n*plotH} stroke={c.line} strokeWidth={1} strokeDasharray={n===1?'':'2 5'}/>)}
    <SvgText x={width-2} y={top+4} fill={c.faint} fontSize={10} textAnchor="end">{max}</SvgText>
    {series.map((s,i)=>{const x=left+i*slot+slot*.22,w=slot*.56,h=s.value/max*plotH;return <ReactFragment key={s.date}>
     <Rect x={x} y={top} width={w} height={plotH} rx={w/2} fill={c.surfaceAlt}/>
     {s.value>0?<Column x={x} baseline={height-bottom} width={w} height={h} delay={i*30} rx={Math.min(w/2,h/2)} fill={selected===s.date?c.ink:c.accent} fillOpacity={selected&&selected!==s.date?.35:.9}/>:null}
     {s.done>0?<Rect x={x} y={height-bottom-s.done/max*plotH} width={w} height={s.done/max*plotH} rx={Math.min(w/2,s.done/max*plotH/2)} fill={c.success}/>:null}
     <SvgText x={x+w/2} y={height-7} fill={selected===s.date?c.ink:c.faint} fontSize={11} textAnchor="middle">{s.label.slice(0,1)}</SvgText>
    </ReactFragment>})}
   </Svg>
   <View style={{position:'absolute',left:0,right,height:height,top:0,flexDirection:'row'}}>{series.map(s=><Pressable key={s.date} accessibilityRole="button" accessibilityLabel={`${s.date}, ${s.value} tasks due, ${s.done} done`} accessibilityState={{selected:selected===s.date}} onPress={()=>setSelected(s.date)} style={{flex:1}}/>)}</View>
  </View>
  <View style={{flexDirection:'row',alignItems:'center',gap:8,minHeight:28}}><View style={{width:6,height:6,borderRadius:3,backgroundColor:c.accent}}/><T size={11} muted>Due</T><View style={{width:6,height:6,borderRadius:3,backgroundColor:c.success,marginLeft:8}}/><T size={11} muted>Done tasks due</T>
   {chosen&&onOpenDate?<Pressable accessibilityRole="button" accessibilityLabel={`Open schedule for ${chosen.date}`} onPress={()=>onOpenDate(chosen)} style={{marginLeft:'auto',minHeight:44,justifyContent:'center'}}><T size={12} color={c.accentText}>View tasks</T></Pressable>:null}
  </View>
 </View>;
}
// Fragment must be a React fragment so the SVG receives only its own primitives.
import {Fragment as ReactFragment} from 'react';
export function HistoryArea({series,label='Completed sprint velocity',unit='tasks'}){
 const{c}=useTheme();const id=useId().replace(/[^a-z0-9]/gi,'');const[width,setWidth]=useState(320),[selected,setSelected]=useState(null);const height=164;
 const points=useMemo(()=>pointsFor(series.map(x=>x.value),width,height,16),[series,width]);const d=linePath(points);const i=selected===null?Math.max(0,series.length-1):Math.min(selected,series.length-1);const picked=series[i];
 const length=points.slice(1).reduce((n,p,i)=>n+Math.hypot(p.x-points[i].x,p.y-points[i].y),0)||1;
 if(!series.length)return <View style={{alignItems:'center',gap:8,padding:12}}><EmptyArtwork size={128} kind="schedule"/><T size={15} weight="600">A history worth keeping</T><T muted size={13}>Completed sprints will build this chart. No history is inferred.</T></View>;
 return <View style={{gap:14}}>
  <View style={{flexDirection:'row',alignItems:'flex-end',gap:12}}><View style={{flex:1,gap:4}}><T size={16} weight="600">{label}</T><T size={12} muted>{picked?.label}</T></View><T size={28} weight="500">{picked?.value}<T size={12} muted> {unit}</T></T></View>
  <View onLayout={e=>{if(e.nativeEvent.layout.width>0)setWidth(e.nativeEvent.layout.width);}} style={{height}}>
   <Svg width={width} height={height} pointerEvents="none"><Defs><LinearGradient id={id} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={c.accent} stopOpacity={.22}/><Stop offset="1" stopColor={c.accent} stopOpacity={0}/></LinearGradient></Defs>
    {[.25,.5,.75].map(p=><Line key={p} x1={16} x2={width-16} y1={height*p} y2={height*p} stroke={c.line} strokeDasharray="2 5"/>)}
    <Path d={`${d} L${points.at(-1).x},${height-16} L${points[0].x},${height-16} Z`} fill={`url(#${id})`}/>
    <TracePath d={d} length={length+2} fill="none" stroke={c.accent} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round"/>
    {points[i]?<><Line x1={points[i].x} x2={points[i].x} y1={16} y2={height-16} stroke={c.faint} strokeDasharray="2 5"/><Circle cx={points[i].x} cy={points[i].y} r={5} fill={c.accent} stroke={c.surface} strokeWidth={3}/></>:null}
   </Svg>
   <View style={{position:'absolute',inset:0,flexDirection:'row'}}>{series.map((s,i)=><Pressable key={s.id||i} accessibilityRole="button" accessibilityLabel={`${s.label}, ${s.value} ${unit}`} onPress={()=>setSelected(i)} style={{flex:1}}/>)}</View>
  </View>
  <View style={{flexDirection:'row',justifyContent:'space-between'}}><T size={11} muted>{series[0].label}</T><T size={11} muted>{series.at(-1).label}</T></View>
 </View>;
}
export function BudgetComparison({budget,planned,actual,format=String}){
 const{c}=useTheme();const max=Math.max(1,budget,planned,actual);return <View style={{gap:22}}>
  {[['Approved',budget,c.faint],['Planned',planned,c.accent],['Spent',actual,c.success]].map(([label,value,color])=><View key={label} style={{gap:10}}>
   <View style={{flexDirection:'row',justifyContent:'space-between'}}><T size={13} muted>{label}</T><T size={15} weight="500">{format(value)}</T></View>
   <View accessibilityLabel={`${label} ${format(value)}`} style={{height:16,borderRadius:4,backgroundColor:c.surfaceAlt,overflow:'hidden'}}><View style={{height:'100%',width:`${Math.max(0,value)/max*100}%`,borderRadius:4,backgroundColor:color}}/></View>
  </View>)}
 </View>;
}
export function StageTrack({items}){
 const{c}=useTheme();const total=Math.max(1,items.reduce((n,x)=>n+x.value,0));return <View style={{gap:16}}>
  <View style={{height:8,flexDirection:'row',gap:4}}>{items.map((x,i)=>x.value?<View key={x.label} style={{flex:x.value/total,borderRadius:4,backgroundColor:[c.accent,c.info,c.success][i%3]}}/>:null)}</View>
  <View style={{flexDirection:'row',gap:12}}>{items.map((x,i)=><View key={x.label} style={{flex:1,gap:6}}><View style={{flexDirection:'row',alignItems:'center',gap:5}}><View style={{width:5,height:5,borderRadius:3,backgroundColor:[c.accent,c.info,c.success][i%3]}}/><T size={11} muted numberOfLines={1}>{x.label}</T></View><T size={22} weight="500">{x.value}</T></View>)}</View>
 </View>;
}
export function CompletionArc({value=0,label='Complete',size=100,color}){
 const{c}=useTheme();const r=34,length=2*Math.PI*r*.75,v=Math.min(1,Math.max(0,Number.isFinite(value)?value:0));
 return <View accessibilityLabel={`${label}, ${Math.round(v*100)} percent`} style={{width:size,height:size,alignItems:'center',justifyContent:'center'}}>
  <Svg width={size} height={size} viewBox="0 0 100 100" pointerEvents="none" style={{position:'absolute'}}><Circle cx={50} cy={50} r={r} transform="rotate(135 50 50)" fill="none" stroke={c.line} strokeWidth={6} strokeDasharray={`${length} ${2*Math.PI*r-length}`} strokeLinecap="round"/>{v>0?<Circle cx={50} cy={50} r={r} transform="rotate(135 50 50)" fill="none" stroke={color||c.accent} strokeWidth={6} strokeDasharray={`${length*v} ${2*Math.PI*r-length*v}`} strokeLinecap="round"/>:null}</Svg>
  <T size={Math.round(size*.21)} weight="600">{Math.round(v*100)}%</T><T size={10} muted>{label}</T>
 </View>;
}
export function WorkloadBalance({series,onStatus,progress=0}){
 const{c}=useTheme();const[picked,setPicked]=useState(null);const total=series.reduce((n,x)=>n+x.value,0),max=Math.max(1,...series.map(x=>x.value)),colors=tones(c);
 return <View style={{gap:20}}>
  <View style={{flexDirection:'row',gap:20,alignItems:'center'}}>
   <View style={{width:106,gap:6}}><CountValue value={total} size={46}/><T size={12} muted>project tasks</T><View style={{height:1,backgroundColor:c.line,marginVertical:6}}/><CountValue size={18} color={c.accentText} value={`${Math.round(progress*100)}%`}/><T size={11} muted>weighted progress</T></View>
   <View style={{flex:1,height:144}}>
    <Svg width="100%" height={144} viewBox="0 0 184 144" preserveAspectRatio="none" pointerEvents="none"><Line x1={0} x2={184} y1={122} y2={122} stroke={c.line}/>{series.map((s,i)=>{const x=i*46+9,h=s.value/max*88;return <ReactFragment key={s.label}>
     <Rect x={x} y={24} width={27} height={98} rx={8} fill={c.surfaceAlt}/><Column x={x} width={27} height={h} baseline={122} rx={8} fill={colors[i]} opacity={picked&&picked!==s.label?.35:1} delay={i*35}/>

    </ReactFragment>})}</Svg>
    <View pointerEvents="none" style={{position:'absolute',top:0,left:0,right:0,flexDirection:'row'}}>{series.map(s=><T key={s.label} size={12} center style={{flex:1}}>{s.value}</T>)}</View>
    <View style={{position:'absolute',inset:0,flexDirection:'row'}}>{series.map(s=><Pressable key={s.label} accessibilityRole="button" accessibilityLabel={`Inspect ${s.label}, ${s.value} tasks`} accessibilityState={{selected:picked===s.label}} onPress={()=>setPicked(v=>v===s.label?null:s.label)} style={{flex:1}}/>)}</View>
   </View>
  </View>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:12}}>{series.map((s,i)=><View key={s.label} style={{flexDirection:'row',alignItems:'center',gap:6}}><View style={{width:5,height:5,borderRadius:3,backgroundColor:colors[i]}}/><T size={11} muted>{s.label}</T></View>)}</View>
  {picked?<Pressable accessibilityRole="button" accessibilityLabel={`Open ${picked} tasks`} onPress={()=>onStatus?.(picked)} style={{minHeight:44,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderTopWidth:1,borderColor:c.line,paddingTop:8}}><T size={13}>{series.find(s=>s.label===picked)?.value} in {picked}</T><Feather name="arrow-up-right" size={18} color={c.accentText}/></Pressable>:null}
 </View>;
}
