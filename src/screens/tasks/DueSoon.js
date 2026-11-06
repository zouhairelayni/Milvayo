// /src/screens/tasks/DueSoon.js
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { Card, T } from '../../ui/ui';
import { useScreenActive } from '../../store/store';

export default function DueSoon({ tasks, onOpenTask }) {
  const active=useScreenActive(),fontScale=useWindowDimensions().fontScale||1;
  const rowHeight=Math.max(56,Math.ceil(40*fontScale)+16);
  const [window,setWindow]=useState({tasks,count:3});
  const shown=window.tasks===tasks?window.count:3;
  const scrollRef=useRef(null),userScroll=useRef(false),lastLoad=useRef(-1),position=useRef({y:0,max:0,height:0,content:0});
  useEffect(()=>{userScroll.current=false;lastLoad.current=-1;position.current.y=0;scrollRef.current?.scrollTo({y:0,animated:false});},[tasks]);
  const load=()=>setWindow({tasks,count:Math.min(tasks.length,shown+3)});
  const onScroll=e=>{
    const {contentOffset,layoutMeasurement,contentSize}=e.nativeEvent;
    position.current.y=contentOffset.y;
    if(!active||!userScroll.current||contentOffset.y<=0||contentOffset.y<=lastLoad.current||shown>=tasks.length)return;
    if(contentOffset.y+layoutMeasurement.height>=contentSize.height-rowHeight){lastLoad.current=contentOffset.y;load();}
  };
  return <Card style={{ gap: 8 }}>
    <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}>
      <T weight="600" size={14} accessibilityRole="header">Due soon</T>
      {tasks.length>3?<T muted size={11}>Scroll to navigate tasks</T>:null}
    </View>
    {tasks.length?<ScrollView ref={scrollRef} accessibilityLabel="Due soon tasks" accessibilityHint="Scroll through upcoming tasks"
      nestedScrollEnabled scrollEventThrottle={32} style={{height:rowHeight*Math.min(3,tasks.length)}}
      contentContainerStyle={{paddingBottom:shown<tasks.length?rowHeight/2:0}}
      onScrollBeginDrag={()=>{userScroll.current=true;}} onScroll={onScroll}
      {...(Platform.OS==='web'?{tabIndex:0,onWheel:()=>{userScroll.current=true;},onTouchMove:()=>{userScroll.current=true;},onKeyDown:()=>{userScroll.current=true;}}:{})}
      onLayout={e=>{position.current.height=e.nativeEvent.layout.height;position.current.max=Math.max(0,position.current.content-position.current.height);}}
      onContentSizeChange={(_w,h)=>{position.current.content=h;position.current.max=Math.max(0,h-position.current.height);}}
      accessibilityActions={[{name:'increment',label:'Scroll to later tasks'},{name:'decrement',label:'Scroll to earlier tasks'}]}
      onAccessibilityAction={e=>{
        if(!active||!['increment','decrement'].includes(e.nativeEvent.actionName))return;userScroll.current=true;
        const forward=e.nativeEvent.actionName==='increment',p=position.current,y=Math.max(0,Math.min(p.max,p.y+(forward?1:-1)*rowHeight*2));
        if(forward&&y===p.y&&shown<tasks.length)load();else scrollRef.current?.scrollTo({y,animated:false});
      }}>
      {tasks.slice(0,shown).map(t=><Pressable key={t.id} onPress={()=>onOpenTask(t.id)} accessibilityRole="button" accessibilityLabel={`Open task ${t.title}`}
        style={({pressed})=>({flexDirection:'row',gap:10,alignItems:'center',height:rowHeight,paddingVertical:8,opacity:pressed?.6:1})}>
        <T size={12} muted style={{width:Math.min(144,Math.ceil(84*fontScale))}}>{t.due}</T>
        <T size={13} numberOfLines={2} style={{flex:1}}>{t.title}</T>
      </Pressable>)}
    </ScrollView>:<T muted size={12}>Nothing due soon. Set a task due date to see it here.</T>}
  </Card>;
}
