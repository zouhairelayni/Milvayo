// /src/screens/canvas/CanvasPopover.js
import {createContext,useContext,useState} from 'react';
import {KeyboardAvoidingView,Platform,Pressable,ScrollView,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useBackDismiss} from '../../app/navigation/useBackNavigation';
import {T} from '../../ui/uiBase';
import {useTheme} from '../../ui/theme/theme';
import {CanvasTool} from './CanvasToolbar';
const Host=createContext(null),Body=createContext(360);
export function CanvasPopoverHost({value,children}){return <Host.Provider value={value}>{children}</Host.Provider>;}
export const useCanvasPopoverHeight=()=>useContext(Body);
export default function CanvasPopover({title,viewport,onClose,children,extent=360,scrollable=true,aboveRail=false,near=null,onBack:explicitBack}){
 const {c}=useTheme(),insets=useSafeAreaInsets(),host=useContext(Host),[available,setAvailable]=useState(viewport.height),[panelHeight,setPanelHeight]=useState(160),height=Math.min(available,viewport.height),bottom=(host?.bottom??Math.max(12,insets.bottom)+72)+(host?.contextual||aboveRail?66:0),maxHeight=Math.max(48,Math.min(near?220:460,near?height-24:height-bottom-12)),width=Math.min(extent,viewport.width-24),Content=scrollable?ScrollView:View;
 const onBack=explicitBack||host?.onBack;useBackDismiss(true,onBack||onClose,30);
 return <KeyboardAvoidingView pointerEvents="box-none" behavior={Platform.OS==='ios'?'padding':'height'} keyboardVerticalOffset={insets.top+57} style={{position:'absolute',left:0,right:0,top:0,bottom:0}}>
  <View pointerEvents="box-none" style={{flex:1}} onLayout={e=>{const next=e.nativeEvent.layout.height;if(next>0)setAvailable(old=>old===next?old:next);}}>
   <Pressable accessibilityRole="button" accessibilityLabel={`Dismiss ${title}`} onPress={onClose} style={{position:'absolute',left:0,right:0,top:0,bottom:0}}/>
   <View accessibilityLabel={title} onLayout={e=>setPanelHeight(e.nativeEvent.layout.height)} style={{position:'absolute',width,left:Math.max(12,Math.min(viewport.width-width-12,near?near.x-width/2:(viewport.width-width)/2)),...(near?{top:Math.max(12,Math.min(height-panelHeight-12,near.y+12))}:{bottom:Math.min(bottom,Math.max(0,height-48))}),maxHeight,backgroundColor:c.surface,borderRadius:12,borderWidth:1,borderColor:c.line,overflow:'hidden'}}>
    <View style={{paddingLeft:12,flexDirection:'row',alignItems:'center'}}><T size={14} weight="600" style={{flex:1}}>{title}</T><>{onBack?<CanvasTool label={`Back from ${title}`} icon="chevron-left" caption={false} onPress={onBack}/>:null}</><CanvasTool label={`Close ${title}`} icon="x" caption={false} onPress={onClose}/></View>
    <Body.Provider value={Math.max(0,maxHeight-58)}><Content {...(scrollable?{keyboardShouldPersistTaps:'handled',contentContainerStyle:{padding:8,paddingTop:0,gap:8}}:{style:{padding:8,paddingTop:0,gap:8}})} style={scrollable?{flexGrow:0,flexShrink:1}: {padding:8,paddingTop:0,gap:8,flexShrink:1,minHeight:0}}>{children}</Content></Body.Provider>
   </View>
  </View>
 </KeyboardAvoidingView>;
}
