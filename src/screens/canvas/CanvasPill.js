// /src/screens/canvas/CanvasPill.js
import {useEffect,useRef,useState} from 'react';
import {View,useWindowDimensions} from 'react-native';
import {Feather} from '@expo/vector-icons';
import {T} from '../../ui/uiBase';
import PressSurface from '../../ui/PressSurface';
import {useTheme} from '../../ui/theme/theme';
import CanvasPillMotion from './CanvasPillMotion';
export default function CanvasPill({open,onToggle,width,mode,selected,onAdd,onMode,onEdit,onTools}){
 const [active,setActive]=useState(false),idle=useRef(null);
 const wake=()=>{setActive(true);clearTimeout(idle.current);idle.current=setTimeout(()=>setActive(false),1800);};
 useEffect(()=>{if(open)wake();else{clearTimeout(idle.current);setActive(false);}return()=>clearTimeout(idle.current);},[open]);
 const {c}=useTheme(),{fontScale=1}=useWindowDimensions(),extent=Math.min(320,Math.max(264,width-24)),items=[['Add','plus',onAdd,false],['Mode','mouse-pointer',onMode,false],['Edit','edit-3',onEdit,!selected],['Tools','more-horizontal',onTools,false]];
 return <View onTouchStart={wake} onPointerDown={wake} onFocus={wake} pointerEvents="box-none" style={{position:'absolute',left:12,bottom:12,width:extent,height:56}}>
  <CanvasPillMotion open={open} active={active} width={extent} colors={c}/>
  <PressSurface accessibilityRole="button" accessibilityLabel={open?'Collapse Canvas toolbar':'Expand Canvas toolbar'} accessibilityState={{expanded:open}} onPress={onToggle} style={{width:56,height:56,borderRadius:28,alignItems:'center',justifyContent:'center'}}><Feather name={open?'chevron-left':'sliders'} size={20} color={c.ink}/></PressSurface>
  {open?<View pointerEvents={open?'auto':'none'} accessibilityElementsHidden={!open} importantForAccessibility={open?'auto':'no-hide-descendants'} style={{position:'absolute',left:56,top:0,width:extent-60,height:56,flexDirection:'row',opacity:open?1:0}}>
   {items.map(([label,icon,onPress,disabled])=><PressSurface key={label} accessibilityRole="button" accessibilityLabel={label==='Mode'?`Canvas mode: ${mode}`:label==='Tools'?'Canvas tools':label} accessibilityState={{disabled}} disabled={disabled} onPress={onPress} containerStyle={{flex:1}} style={{minWidth:48,minHeight:48,alignItems:'center',justifyContent:'center',gap:2,borderRadius:24,opacity:disabled ? 0.38 : 1}}><Feather name={icon} size={17} color={c.ink}/>{fontScale<=1.5?<T size={12} weight="500">{label}</T>:null}</PressSurface>)}
  </View>:null}
 </View>;
}
