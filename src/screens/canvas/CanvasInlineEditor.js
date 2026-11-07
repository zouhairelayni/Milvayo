// /src/screens/canvas/CanvasInlineEditor.js
import {useState} from 'react';
import {Platform,Pressable,TextInput,View} from 'react-native';
import {useTheme} from '../../ui/theme/theme';
const {inlineEditorBox}=require('../../canvas/presentation.cjs');
export default function CanvasInlineEditor({edit,pose,viewport,onChange,onDone,onCancel}){
 const [value,setValue]=useState(edit.value);
 const {c}=useTheme(),resolve=value=>c[value]||value,box=inlineEditorBox(edit.box,pose,viewport);
 return <View style={{position:'absolute',left:0,right:0,top:0,bottom:0}}>
  <Pressable accessibilityLabel="Finish editing on canvas" accessibilityRole="button" onPress={onDone} style={{position:'absolute',left:0,right:0,top:0,bottom:0}}/>
  <TextInput autoFocus selectTextOnFocus multiline={!edit.nodeId} value={value} maxLength={edit.nodeId?300:12000} onChangeText={value=>{setValue(value);onChange(value);}} onBlur={onDone} onSubmitEditing={edit.nodeId?onDone:undefined} onKeyPress={e=>{if(e.nativeEvent.key==='Escape')onCancel();}} accessibilityLabel={edit.nodeId?'Edit diagram node on canvas':'Edit text on canvas'}
   style={{position:'absolute',left:box.x,top:box.y,width:box.width,height:box.height,backgroundColor:resolve(edit.fill),color:resolve(edit.ink),textAlignVertical:'top',fontSize:Math.max(16,14*pose.scale),padding:edit.nodeId?2:4,borderWidth:0,borderRadius:edit.nodeId?8:0,...(Platform.OS==='web'?{outlineStyle:'none'}:{})}}/>
 </View>;
}
