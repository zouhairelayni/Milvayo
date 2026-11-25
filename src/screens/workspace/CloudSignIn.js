// /src/screens/workspace/CloudSignIn.js
// 0.8.42: the cloud sign-in card. It replaces a column of five similar boxes and three similar buttons that read like a terminal.
// What changed: one clear heading, two fields people know (email and password), one choice in words (open the cloud copy, or send this one),
// one main button, and the technical fields (server address, organization, workspace) folded away under "Connection details".
// Behaviour is unchanged: the same connect() call, the same field labels (the browser smoke test finds the inputs by them).
import {useState} from 'react';
import {View} from 'react-native';
import {Feather} from '@expo/vector-icons';
import {Button,Input,T} from '../../ui/ui';
import {Fold,Pick} from '../../components/inline/CompactTools';
import {useTheme} from '../../ui/theme/theme';
const {SIGN_IN_AGAIN}=require('../../cloud/syncBanner.cjs');

const MODES=[{value:'open',label:'Open the cloud copy'},{value:'publish',label:'Send this workspace'}];
const EXPLAIN={
 open:'Loads the shared workspace from the cloud. A recovery copy of this device is saved first, so nothing is lost.',
 publish:'Uploads this workspace as a new cloud workspace. Use it the first time, to start sharing.'
};

function Field({label,children}){return <View style={{gap:6}}><T muted size={12} weight="600">{label}</T>{children}</View>;}

export default function CloudSignIn({fields,onConnect,onAcceptInvite,busy}){
 const {c}=useTheme(),[mode,setMode]=useState('open'),[inviteToken,setInviteToken]=useState('');
 const {host,setHost,email,setEmail,password,setPassword,orgId,setOrgId,workspaceId,setWorkspaceId}=fields;
 const ready=email.trim()&&password;
 return <View style={{gap:16}}>
  <View style={{borderRadius:16,borderWidth:1,borderColor:c.line,backgroundColor:c.surface,padding:20,gap:18}}>
   <View style={{gap:10}}>
    <View style={{width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center',backgroundColor:c.elevated}}><Feather name="cloud" size={22} color={c.ink}/></View>
    <T weight="600" size={22}>Sign in to cloud sync</T>
    <T muted size={13}>Work with your team on the same projects. Your work stays on this device whether or not you sign in.</T>
   </View>
   <Field label="Email"><Input value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" accessibilityLabel="Emulator account email"/></Field>
   <Field label="Password"><Input value={password} onChangeText={setPassword} secure placeholder="Your password" accessibilityLabel="Emulator account password" onSubmitEditing={()=>ready&&!busy&&onConnect(mode==='publish',false)}/></Field>
   <Field label="What would you like to do?">
    <Pick values={MODES} value={mode} onChange={setMode}/>
    <T muted size={12}>{EXPLAIN[mode]}</T>
   </Field>
   <Button label={busy?'Signing in…':'Sign in'} disabled={busy||!ready} onPress={()=>onConnect(mode==='publish',false)}/>
   <Button label="New here? Create a test account" variant="ghost" disabled={busy||!ready} onPress={()=>onConnect(mode==='publish',true)}/>
   <T muted size={12} center>{SIGN_IN_AGAIN}</T>
  </View>
  <Fold title="Connection details" subtitle="Server address, organization and workspace. Most people leave these as they are.">
   <Field label="Server address"><Input value={host} onChangeText={setHost} autoCapitalize="none" placeholder="127.0.0.1" accessibilityLabel="Private emulator host"/></Field>
   <Field label="Organization"><Input value={orgId} onChangeText={setOrgId} autoCapitalize="none" placeholder="Leave blank for your own" accessibilityLabel="Cloud organization ID"/></Field>
   <Field label="Workspace"><Input value={workspaceId} onChangeText={setWorkspaceId} autoCapitalize="none" placeholder="main" accessibilityLabel="Cloud workspace ID"/></Field>
   <T muted size={12}>Test setup · demo-milvayo-083 · billing is simulated.</T>
  </Fold>
  <Fold title="Accept an invitation" subtitle="Sign in details and organization above are used.">
   <Field label="Invitation code"><Input value={inviteToken} onChangeText={setInviteToken} placeholder="Paste the code you were sent" accessibilityLabel="Local invitation token"/></Field>
   <Button label="Accept invitation" variant="secondary" disabled={busy||!ready||!orgId.trim()||!inviteToken.trim()} onPress={async()=>{if(await onAcceptInvite(inviteToken))setInviteToken('');}}/>
   {!orgId.trim()?<T muted size={12}>Enter the organization under Connection details first.</T>:null}
  </Fold>
 </View>;
}
