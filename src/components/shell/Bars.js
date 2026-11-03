// /src/components/shell/Bars.js
import { useRef } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, useTheme } from '../../ui/theme/theme';
import { Button, IconBtn, Input, T } from '../../ui/ui';
import { diagnosticMonitor } from '../../diagnostics/monitor';

export function TopBar({ query, onQuery, onNew, mode, onToggleMode }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 32, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.line, backgroundColor: c.bg }}>
      <View style={{ flex: 1, maxWidth: 420, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: 14 }}>
        <Feather name="search" size={16} color={c.muted} />
        <Input value={query} onChangeText={onQuery} placeholder="Search tasks" style={{ flex: 1, backgroundColor: 'transparent', paddingHorizontal: 0 }} />
      </View>
      <View style={{ flex: 1 }} />
      <IconBtn icon={mode === 'dark' ? 'sun' : 'moon'} label="Toggle theme" onPress={onToggleMode} />
      <Button label="New task" icon="plus" small onPress={onNew} />
    </View>
  );
}

export function TabBar({ tabs, current, go, intent }) {
  const touches = useRef({});
  const { c } = useTheme();
  return (
    <View style={{ flexDirection:'row', backgroundColor:c.surface, borderTopColor:c.line, borderTopWidth:1, paddingHorizontal:8, paddingTop:7, paddingBottom:Platform.OS==='ios'?12:7 }}>
      {tabs.map(([k,l,i]) => {
        const on=current===k;
        return <Pressable key={k} accessibilityRole="tab" accessibilityLabel={l} accessibilityState={{selected:on}} pressRetentionOffset={0} onPressIn={(e)=>{ touches.current[k] = {...intent.begin(k), at: e.nativeEvent.timestamp ?? e.timeStamp}; }} onPress={(e)=>{
          const press = touches.current[k]; delete touches.current[k];
          if (!intent.accept(press,k)) { diagnosticMonitor.recordAction(`ignored stale tab press: ${k}`); return; }
          diagnosticMonitor.recordAction(`tab input: ${k}; down=${press.at}; up=${e.nativeEvent.timestamp ?? e.timeStamp}`);
          go(k);
        }}
          style={({pressed})=>({flex:1, minHeight:55, borderRadius:15, alignItems:'center', justifyContent:'center', gap:3, backgroundColor:on?c.surfaceAlt:'transparent', opacity:pressed?0.65:1})}>
          <View style={k === 'timeline' ? { transform: [{ rotate: '90deg' }] } : undefined}><Feather name={i} size={19} color={on?c.accent:c.muted}/></View>
          <T size={11} weight={on?'700':'500'} color={on?c.ink:c.muted} numberOfLines={1}>{l}</T>
        </Pressable>;
      })}
    </View>
  );
}
