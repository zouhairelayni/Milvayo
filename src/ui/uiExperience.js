// /src/ui/uiExperience.js
import {useRef,useState} from 'react';
import {Pressable,View} from 'react-native';
import {Feather} from '@expo/vector-icons';
import {useTheme} from './theme/theme';
import {T} from './uiBase';
import {Button,IconBtn} from './uiControls';
import {Sheet} from './uiLayout';
import EmptyArtwork from '../components/illustrations/EmptyArtwork';

export function EmptyState({title,description,kind='work',action,compact=false}){
 return <View style={{alignItems:'center',paddingVertical:compact?16:28,paddingHorizontal:16,gap:12}}>
  <EmptyArtwork kind={kind} size={compact?124:166}/>
  <T accessibilityRole="header" size={18} weight="600" center>{title}</T>
  {description?<T size={14} muted center style={{maxWidth:360,lineHeight:21}}>{description}</T>:null}
  {action?<View style={{marginTop:4,alignItems:'center'}}>{action}</View>:null}
 </View>;
}

// Confirmation is a state of this popup, never a jump back to its parent screen.
export function ActionMenu({label='More actions',items,icon='more-horizontal',header}){
 const {c}=useTheme();const[open,setOpen]=useState(false),[selectedLabel,setSelectedLabel]=useState(null);
 const[busy,setBusy]=useState(false),[error,setError]=useState(''),[feedback,setFeedback]=useState('');const pending=useRef(false);
 const selected=items.find(item=>item&&item.label===selectedLabel),confirmation=selected?.confirmation||{};
 const close=()=>{if(pending.current)return;setOpen(false);setSelectedLabel(null);setError('');setFeedback('');};
 const cancel=()=>{if(pending.current)return;setSelectedLabel(null);setError('');};
 const confirm=async()=>{
  if(pending.current||!selected||selected.disabled)return;pending.current=true;setBusy(true);setError('');
  try{const result=await selected.onPress?.();
   if(result===false||result===null)setError('The change was not applied. Check the details and try again.');
   else{setFeedback(confirmation.successMessage||'Change applied.');setSelectedLabel(null);}
  }catch(e){setError(e?.message||'The change could not be completed.');}
  finally{pending.current=false;setBusy(false);}
 };
 const choose=item=>{
  if(item.disabled||pending.current)return;setError('');setFeedback('');
  if(item.confirmation||item.danger)setSelectedLabel(item.label);
  else{setOpen(false);item.onPress?.();}
 };
 return <>
  <IconBtn icon={icon} label={label} onPress={()=>{setSelectedLabel(null);setError('');setFeedback('');setOpen(true);}}/>
  {open?<Sheet visible compact title={selected?(confirmation.title||`${selected.label}?`):label} onClose={close} showNotice={false}
   footer={selected?<><Button label="Cancel" variant="ghost" disabled={busy} onPress={cancel}/><View style={{flex:1}}/>
    <Button label={busy?'Please wait…':confirmation.confirmLabel||selected.label} variant={selected.danger?'danger':'primary'} disabled={busy||selected.disabled} onPress={confirm}/></>:undefined}>
   {selected?<>
    <T size={15} style={{lineHeight:23}}>{confirmation.description||selected.description||'Confirm this change before continuing.'}</T>
    {error?<T accessibilityRole="alert" color={c.danger}>{error}</T>:null}
   </>:<>
    {header}
    {feedback?<Feedback type="success" text={feedback}/>:null}
    {items.filter(Boolean).map(item=><Pressable key={item.label} disabled={item.disabled} accessibilityRole="button" accessibilityLabel={item.label}
     accessibilityState={{disabled:!!item.disabled}} onPress={()=>choose(item)}
     style={({pressed})=>({minHeight:52,paddingHorizontal:12,paddingVertical:12,borderRadius:12,flexDirection:'row',alignItems:'center',gap:12,backgroundColor:pressed?c.selection:'transparent',opacity:item.disabled?.4:1})}>
     <Feather name={item.icon||'chevron-right'} size={18} color={item.danger?c.danger:c.accentText}/>
     <View style={{flex:1,gap:3}}><T weight="500" color={item.danger?c.danger:c.ink}>{item.label}</T>{item.description?<T size={12} muted>{item.description}</T>:null}</View>
    </Pressable>)}
   </>}
  </Sheet>:null}
 </>;
}

export function ActionRow({primary,children,menuLabel,items}){
 return <View style={{flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:8}}>
  {primary}{children}{items?.length?<ActionMenu label={menuLabel} items={items}/>:null}
 </View>;
}

export function ConfirmSheet({visible,title,description,confirmLabel='Confirm',danger=false,onConfirm,onClose}){
 const {c}=useTheme();const[busy,setBusy]=useState(false),[error,setError]=useState('');const pending=useRef(false);
 const confirm=async()=>{
  if(pending.current)return;pending.current=true;setBusy(true);setError('');
  try{const result=await onConfirm();if(result!==false)onClose();else setError('The change was not applied. Check the details and try again.');}
  catch(e){setError(e?.message||'The change could not be completed.');}
  finally{pending.current=false;setBusy(false);}
 };
 return <Sheet visible={visible} compact title={title} onClose={()=>{if(!pending.current)onClose();}} footer={<>
  <Button label="Cancel" variant="ghost" disabled={busy} onPress={onClose}/>
  <View style={{flex:1}}/><Button label={busy?'Please wait…':confirmLabel} variant={danger?'danger':'primary'} disabled={busy} onPress={confirm}/>
 </>}>
  <View style={{width:48,height:48,borderRadius:16,backgroundColor:(danger?c.danger:c.accentText)+'18',alignItems:'center',justifyContent:'center'}}><Feather name={danger?'alert-triangle':'check-circle'} size={24} color={danger?c.danger:c.accentText}/></View>
  <T size={15} style={{lineHeight:23}}>{description}</T>
  {error?<T accessibilityRole="alert" color={c.danger}>{error}</T>:null}
 </Sheet>;
}

export function FormSection({title,description,children}){
 const{c}=useTheme();return <View style={{gap:12,paddingTop:12,borderTopWidth:1,borderColor:c.line}}>
  <View style={{gap:4}}><T size={16} weight="600">{title}</T>{description?<T muted size={13}>{description}</T>:null}</View>{children}
 </View>;
}

export function Feedback({text,type='info',action}){
 const{c}=useTheme();const color=c[type]||c.info;
 return <View accessibilityLiveRegion={type==='danger'?'assertive':'polite'} style={{padding:16,borderRadius:14,backgroundColor:color+'12',flexDirection:'row',alignItems:'flex-start',gap:12}}>
  <Feather name={type==='success'?'check-circle':type==='danger'?'alert-circle':'info'} size={18} color={color}/>
  <T size={14} style={{flex:1,lineHeight:21}}>{text}</T>{action}
 </View>;
}

export function AppearanceChoices({value,onChange,accent}){
 const{c}=useTheme();const{palette}=require('./theme/themePalette.cjs');
 return <View accessibilityRole="radiogroup" style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
  {[['system','System'],['light','Daylight'],['dark','Dark'],['amoled','AMOLED']].map(([id,label])=>{
   const sample=palette(accent,id==='system'?'dark':id),selected=value===id;
   return <Pressable key={id} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{checked:selected}} onPress={()=>onChange(id)}
    style={({pressed})=>({flex:1,minWidth:68,minHeight:116,padding:8,borderRadius:14,borderWidth:selected?2:1,borderColor:selected?c.accentText:c.line,gap:10,backgroundColor:pressed?c.selection:c.surfaceAlt})}>
    <View style={{height:58,borderRadius:8,padding:6,gap:5,backgroundColor:sample.bg}}><View style={{height:7,width:'65%',borderRadius:3,backgroundColor:sample.accent}}/><View style={{height:12,borderRadius:4,backgroundColor:sample.surface}}/><View style={{height:12,borderRadius:4,backgroundColor:id==='system'?'#FFFFFF':sample.elevated}}/></View>
    <T size={12} weight={selected?'600':'400'} center color={selected?c.accentText:c.ink}>{label}</T>
   </Pressable>;
  })}
 </View>;
}
