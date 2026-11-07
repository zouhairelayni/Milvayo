// /src/screens/canvas/CanvasItemList.js
import {useMemo} from 'react';
import {FlatList,View,useWindowDimensions} from 'react-native';
import {Input,T} from '../../ui/ui';
import {useCanvasPopoverHeight} from './CanvasPopover';
import CanvasMenuRow from './CanvasMenuRow';
export default function CanvasItemList({items,query,onQuery,onSelect,label}){
 const {height}=useWindowDimensions(),available=useCanvasPopoverHeight(),rows=useMemo(()=>items.filter(item=>`${item.label} ${item.detail||''}`.toLowerCase().includes(query.toLowerCase())),[items,query]);
 return <View style={{height:Math.max(48,Math.min(available,400,(height-180)*.6,56+Math.max(1,rows.length)*72)),flexShrink:1,minHeight:0,gap:8}}>
  <Input value={query} onChangeText={onQuery} placeholder={label} accessibilityLabel={label}/>
  <FlatList data={rows} keyExtractor={item=>item.id} initialNumToRender={8} maxToRenderPerBatch={8} windowSize={5} keyboardShouldPersistTaps="handled" style={{flex:1,minHeight:48}}
   ListEmptyComponent={<T muted>No matches</T>} renderItem={({item})=><CanvasMenuRow label={item.label} detail={item.detail} icon={item.icon} selected={item.selected} onPress={()=>onSelect(item.id)}/>}/>
 </View>;
}
