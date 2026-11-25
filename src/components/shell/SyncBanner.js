// /src/components/shell/SyncBanner.js
import {useEffect,useState} from 'react';
import {Pressable,View} from 'react-native';
import {T} from '../../ui/ui';
import {useTheme} from '../../ui/theme/theme';
const {describe}=require('../../cloud/syncBanner.cjs');
// Shown on the main screen only while a cloud edit needs a decision. Disappears by itself once nothing needs review.
export default function SyncBanner({session,onReview}){
 const {c}=useTheme();
 const [state,setState]=useState(()=>session?session.getState():null);
 useEffect(()=>{if(!session)return undefined;setState(session.getState());return session.subscribe(setState);},[session]);
 const info=describe(state);
 const shown=info.banner||(info.notice?{text:info.notice,action:'Details'}:null);
 if(!shown)return null;
 return <Pressable accessibilityRole="button" accessibilityLabel={shown.text+' '+shown.action} onPress={onReview}
  style={{marginHorizontal:12,marginTop:8,paddingHorizontal:12,paddingVertical:10,borderRadius:12,borderWidth:1,borderColor:c.line,backgroundColor:c.elevated,flexDirection:'row',alignItems:'center',gap:12}}>
  <View style={{flex:1,minWidth:0}}><T size={13} muted={!info.banner}>{shown.text}</T></View>
  <T size={13}>{shown.action}</T>
 </Pressable>;
}
