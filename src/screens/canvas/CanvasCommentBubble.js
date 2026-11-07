// /src/screens/canvas/CanvasCommentBubble.js
import {useRef,useState} from 'react';
import {ScrollView,View} from 'react-native';
import {Button,Input,T} from '../../ui/ui';
import {useTheme} from '../../ui/theme/theme';
import {useBackDismiss} from '../../app/navigation/useBackNavigation';
import CanvasCommentOverlay from '../../canvas/CanvasCommentOverlay';
import {CanvasTool} from './CanvasToolbar';
const {commentColor}=require('../../canvas/comments.cjs');
export default function CanvasCommentBubble({thread,anchor,box,camera,viewport,onClose,onReply,onResolve}){
 const {c}=useTheme(),[reply,setReply]=useState(''),submitted=useRef(null);useBackDismiss(true,onClose,30);
 return <CanvasCommentOverlay anchor={anchor} box={box} camera={camera} viewport={viewport}><View style={{backgroundColor:c.surface,borderWidth:1,borderColor:c.line,borderRadius:12,maxHeight:Math.max(96,Math.min(360,viewport.height-24)),overflow:'hidden'}}>
  <View style={{flexDirection:'row',alignItems:'center',paddingLeft:12,gap:8}}><View style={{width:10,height:10,borderRadius:5,backgroundColor:commentColor(thread.id)}}/><T size={14} weight="600" style={{flex:1}}>Comment{thread.resolvedAt?' · Resolved':''}</T><CanvasTool label="Close comment" icon="x" caption={false} onPress={onClose}/></View>
  <ScrollView keyboardShouldPersistTaps="handled" style={{flexGrow:0,flexShrink:1}} contentContainerStyle={{padding:12,paddingTop:0,gap:8}}>{thread.messages.map(message=><View key={message.id} style={{padding:12,borderRadius:8,backgroundColor:c.surfaceAlt}}><T>{message.text}</T></View>)}
   <Input style={{minHeight:64}} value={reply} onChangeText={value=>{submitted.current=null;setReply(value);}} multiline accessibilityLabel="Reply to comment" placeholder="Reply"/>
   <View style={{flexDirection:'row',gap:8}}><Button label="Reply" disabled={!reply.trim()} onPress={()=>{const value=reply.trim();if(!value||submitted.current===value)return;submitted.current=value;if(onReply(value))setReply('');else submitted.current=null;}}/><Button label={thread.resolvedAt?'Reopen':'Resolve'} variant="secondary" onPress={onResolve}/></View>
  </ScrollView>
 </View></CanvasCommentOverlay>;
}
