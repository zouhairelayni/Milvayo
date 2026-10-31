import React,{useState} from 'react';
import {View,Text,TextInput,Pressable,Linking} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import design from './design.cjs';
import powerUps from './powerUps.cjs';
import boards from './boards.cjs';
const C=design.colors;
const panel={backgroundColor:C.panel,borderColor:C.border,borderWidth:1,borderRadius:12,padding:14,marginBottom:12};
function T({children,size=12,muted=false,style={}}){return <Text style={[{color:muted?C.muted:C.ink,fontSize:size,lineHeight:Math.round(size*1.5)},style]}>{children}</Text>}
function Button({label,onPress,accent=false,disabled=false,icon}){return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={disabled} style={({pressed})=>({flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7,minHeight:44,paddingHorizontal:12,borderRadius:8,backgroundColor:accent?C.accent:C.panel2,borderWidth:1,borderColor:accent?C.accent:C.border,opacity:disabled?.45:pressed?.7:1})}>{icon&&<Ionicons name={icon} size={16} color={accent?C.bg:C.ink}/>}<T style={{color:accent?C.bg:C.ink}}>{label}</T></Pressable>}
const catalogIcons={github:'logo-github',calendar:'calendar-outline',aging:'time-outline',checklist:'checkbox-outline'};
export function BoardPowerUps({project,boardId,onToggle,onOpenTask}){
 const enabled=powerUps.normalizedPowerUps(project)[boardId]||[];
 const tasks=powerUps.enabled(project,boardId,'calendar')?powerUps.dueSoon(project,boardId):[];
 return <View style={panel}>
  <T size={15}>Power-Ups for this board</T>
  <T muted>Built-in extensions. Enable separately for each Kanban board.</T>
  <View style={{gap:8,marginTop:12}}>{powerUps.CATALOG.map(ext=><View key={ext.id} style={{minHeight:58,flexDirection:'row',alignItems:'center',gap:10,paddingVertical:5,borderTopWidth:1,borderTopColor:C.border}}><Ionicons name={catalogIcons[ext.id]} size={20} color={C.sub}/><View style={{flex:1,gap:3}}><T size={13}>{ext.name}</T><T muted size={11}>{ext.description}</T></View><Button label={enabled.includes(ext.id)?'Enabled':'Enable'} accent={enabled.includes(ext.id)} onPress={()=>onToggle(ext.id)}/></View>)}</View>
  {enabled.includes('calendar')&&<View style={{marginTop:12,paddingTop:12,borderTopColor:C.border,borderTopWidth:1}}><T size={13}>Coming due · next 30 days</T>{tasks.length===0?<T muted>No upcoming tasks with due dates</T>:tasks.slice(0,8).map(task=><Pressable key={task.id} accessibilityRole="button" onPress={()=>onOpenTask(task.id)} style={{flexDirection:'row',gap:8,justifyContent:'space-between',paddingVertical:11,borderBottomColor:C.border,borderBottomWidth:1}}><View style={{flex:1}}><T size={12}>{task.title}</T><T muted size={10}>{task.id}</T></View><T size={11} style={{color:C.accent}}>{task.due}</T></Pressable>)}</View>}
  {enabled.includes('github')&&<T muted size={11} style={{marginTop:12}}>GitHub links work without sign-in. Refreshing metadata supports public repositories only. Private repositories require a future secure account connection.</T>}
 </View>;
}
export function GitHubCardLinks({task,onAdd,onRemove}){
 const [draft,setDraft]=useState('');const [error,setError]=useState('');const [loading,setLoading]=useState('');
 const links=task.githubLinks||[];
 const attach=()=>{try{powerUps.parseGithubUrl(draft);if(onAdd(draft)===false){setError('Could not attach GitHub link. Check the board Power-Up and duplicate links.');return}setDraft('');setError('')}catch(e){setError(e.message)}};
 const refresh=async link=>{setLoading(link.url);setError('');try{const info=await powerUps.fetchPublicPreview(link);onAdd(null,link.url,info)}catch(e){setError(e.message)}finally{setLoading('')}};
 return <View style={panel}>
  <View style={{flexDirection:'row',alignItems:'center',gap:9,marginBottom:8}}><Ionicons name="logo-github" size={21} color={C.ink}/><T size={15}>GitHub</T><View style={{flex:1}}/><T size={11} muted>{links.length} linked</T></View>
  <T muted size={11}>Attach a GitHub issue, pull request, commit or branch. Links are references, not proof of a merge or completed checks.</T>
  {links.map(link=><View key={link.url} style={{paddingTop:12,paddingBottom:10,borderBottomColor:C.border,borderBottomWidth:1,gap:7}}><Pressable accessibilityRole="link" onPress={()=>Linking.openURL(link.url).catch(()=>setError('Could not open GitHub link'))}><T size={12} style={{color:C.accent}}>{link.title||`${link.owner}/${link.repo} · ${link.type} ${link.ref}`}</T></Pressable><T muted size={11}>{link.type.toUpperCase()} · {link.owner}/{link.repo}{link.state?` · ${link.state}`:''}{link.author?` · @${link.author}`:''}{link.commentsCount?` · ${link.commentsCount} comments`:''}</T>{!!link.labels?.length&&<View style={{flexDirection:'row',gap:5,flexWrap:'wrap'}}>{link.labels.map(label=><View key={label} style={{borderWidth:1,borderColor:C.border,borderRadius:5,paddingHorizontal:6,paddingVertical:3}}><T muted size={10}>{label}</T></View>)}</View>}<View style={{flexDirection:'row',gap:7,flexWrap:'wrap'}}><Button label={loading===link.url?'Checking…':'Refresh public details'} disabled={!!loading} onPress={()=>refresh(link)}/><Button label="Remove" onPress={()=>onRemove(link.url)}/></View></View>)}
  <TextInput accessibilityLabel="GitHub resource URL" value={draft} onChangeText={setDraft} autoCapitalize="none" autoCorrect={false} placeholder="https://github.com/org/repo/pull/42" placeholderTextColor={C.muted} style={{marginTop:12,backgroundColor:C.side,color:C.ink,borderColor:C.border,borderWidth:1,borderRadius:8,padding:11,minHeight:44,fontSize:12}}/>
  <View style={{alignItems:'flex-start',marginTop:8}}><Button accent label="Attach GitHub link" icon="link-outline" onPress={attach}/></View>
  {!!error&&<T size={11} style={{color:C.red,marginTop:8}}>{error}</T>}
 </View>;
}
export default BoardPowerUps;
