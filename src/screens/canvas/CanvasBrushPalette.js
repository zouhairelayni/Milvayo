// /src/screens/canvas/CanvasBrushPalette.js
import {useState} from 'react';
import {View,useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {CanvasTool,CanvasToolGroup} from './CanvasToolbar';
import CanvasPopover from './CanvasPopover';
import CanvasSwatches from './CanvasSwatches';
export default function CanvasBrushPalette({mode,busy=false,width,color,onMode,onWidth,onColor,viewport}){
 const [section,setSection]=useState(''),insets=useSafeAreaInsets(),window=useWindowDimensions(),view=viewport||{width:window.width,height:window.height-57};
 return <>
  <View pointerEvents="box-none" style={{position:'absolute',left:12,right:12,bottom:Math.max(12,insets.bottom)+72,alignItems:'center'}}><CanvasToolGroup style={{borderRadius:12}}>
   <CanvasTool label="Brush" icon="edit-2" active={mode==='draw'} onPress={()=>onMode('draw')}/><CanvasTool label={busy?'Erasing…':'Eraser'} disabled={busy} icon="delete" active={mode==='erase'} onPress={()=>onMode('erase')}/>
   <CanvasTool label={`${width} px`} icon="sliders" onPress={()=>setSection('width')}/><CanvasTool label="Ink" icon="droplet" onPress={()=>setSection('color')}/>
  </CanvasToolGroup></View>
  {section?<CanvasPopover viewport={view} aboveRail onBack={()=>setSection('')} title={section==='color'?'Brush ink':'Brush width'} onClose={()=>setSection('')}>
   {section==='color'?<CanvasSwatches value={color} onChange={value=>{onColor(value);setSection('');}}/>:<View style={{flexDirection:'row',gap:4}}>{[1,3,6,12,24].map(value=><CanvasTool key={value} label={String(value)} icon="minus" active={width===value} onPress={()=>{onWidth(value);setSection('');}}/>)}</View>}
  </CanvasPopover>:null}
 </>;
}
