// /src/components/shell/Bars.js
import { useRef } from 'react';
import { Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, useTheme } from '../../ui/theme/theme';
import { Button, IconBtn, Input, T } from '../../ui/ui';
import { diagnosticMonitor } from '../../diagnostics/monitor';
import { ProjectSwitcher } from './Menus';

// Screen actions share the real app header, not an extra toolbar inside Page.
// Both contextual tools and the timeline zoom occupy the same 44pt header rhythm.
export function HeaderControls({controls}) {
  const { c } = useTheme();
  if (!controls) return <View style={{ flex: 1, minWidth: 0 }} />;
  if (controls.kind === 'zoom') return <View style={{ flex: 1, minWidth: 0, height: 44, justifyContent: 'center' }}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1, minWidth: 0 }}
      contentContainerStyle={{flexDirection:'row',alignItems:'center',minHeight:44,paddingHorizontal:2,borderRadius:radius.sm,backgroundColor:c.surfaceAlt}}>
      {['Days','Weeks','Months'].map(value => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`${value} zoom`}
        accessibilityState={{selected:controls.value===value}} onPress={()=>controls.onChange(value)}
        style={({pressed})=>({paddingHorizontal:8,minHeight:40,borderRadius:radius.sm,
          backgroundColor:controls.value===value?c.surface:'transparent',justifyContent:'center',opacity:pressed?.75:1})}>
        <T size={12} weight={controls.value===value?'600':'400'} color={controls.value===value?c.ink:c.muted}>{value}</T>
      </Pressable>)}
    </ScrollView>
  </View>;
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1, minWidth: 0, height: 44 }}
    contentContainerStyle={{ flexGrow: 1, flexDirection:'row', alignItems:'center', justifyContent:'flex-end', gap:8 }}>
    {controls.actions?.map(item=><Button key={item.label} label={item.label} icon={item.icon} small variant={item.variant||'secondary'} onPress={item.onPress}/>)}
  </ScrollView>;
}

export function TopBar({ query, onQuery, onNew, onPickProject, controls }) {
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 1120;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: compact ? 8 : 12, paddingHorizontal: compact ? 16 : 28,
      minHeight: compact ? 64 : 72, paddingVertical: compact ? 10 : 14,
      backgroundColor: c.bg }}>
      <ProjectSwitcher onPickProject={onPickProject} compact={compact} />
      <View style={{ flex: 1, maxWidth: compact ? 240 : 320, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: c.bg, borderWidth: 1, borderColor: c.line, borderRadius: radius.sm, paddingHorizontal: 12, height: 44 }}>
        <Feather name="search" size={16} color={c.muted} />
        <Input value={query} onChangeText={onQuery} accessibilityLabel="Search tasks" placeholder="Search tasks"
          style={{ flex: 1, backgroundColor: 'transparent', borderWidth: 0, paddingHorizontal: 0, height: 42, minHeight: 42, paddingVertical: 0 }} />
      </View>
      <HeaderControls controls={controls} />
      <Button label="New task" icon="plus" small onPress={onNew} />
    </View>
  );
}

export function TabBar({ tabs, current, go, intent }) {
  const touches = useRef({});
  const swipeStart = useRef(null);
  const swipedAt = useRef(0);
  const { c } = useTheme();
  return (
    <View onTouchStart={e=>{const p=e.nativeEvent.touches?.[0];swipeStart.current=p?{x:p.pageX,y:p.pageY}:null;}}
      onTouchEnd={e=>{const p=e.nativeEvent.changedTouches?.[0];const a=swipeStart.current;swipeStart.current=null;if(!p||!a)return;const dx=p.pageX-a.x,dy=p.pageY-a.y;if(Math.abs(dx)<65||Math.abs(dx)<Math.abs(dy)*1.4)return;const i=tabs.findIndex(([k])=>k===current),next=i+(dx<0?1:-1);if(next<0||next>=tabs.length)return;swipedAt.current=Date.now();go(tabs[next][0]);}}
      style={{ flexDirection:'row', backgroundColor:c.surface, borderTopColor:c.line, borderTopWidth:1, paddingHorizontal:8, paddingTop:7, paddingBottom:Platform.OS==='ios'?12:7 }}>
      {tabs.map(([k,l,i]) => {
        const on=current===k;
        return <Pressable key={k} accessibilityRole="tab" accessibilityLabel={l} accessibilityState={{selected:on}} pressRetentionOffset={0} onPressIn={(e)=>{ touches.current[k] = {...intent.begin(k), at: e.nativeEvent.timestamp ?? e.timeStamp}; }} onPress={(e)=>{
          const press = touches.current[k]; delete touches.current[k];
          if(Date.now()-swipedAt.current<450)return;
          if (!intent.accept(press,k)) { diagnosticMonitor.recordAction(`ignored stale tab press: ${k}`); return; }
          diagnosticMonitor.recordAction(`tab input: ${k}; down=${press.at}; up=${e.nativeEvent.timestamp ?? e.timeStamp}`);
          go(k);
        }}
          style={({pressed})=>({flex:1, minHeight:56, borderRadius:9, alignItems:'center', justifyContent:'center', gap:3, backgroundColor:on?c.surfaceAlt:'transparent', opacity:pressed?0.65:1})}>
          <View style={k === 'timeline' ? { transform: [{ rotate: '90deg' }] } : undefined}><Feather name={i} size={19} color={on?c.accent:c.muted}/></View>
          <T size={11} weight={on?'600':'500'} color={on?c.ink:c.muted} numberOfLines={1}>{l}</T>
        </Pressable>;
      })}
    </View>
  );
}
