// /src/components/shell/Bars.js
import { useRef } from 'react';
import { Platform, Pressable, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, useTheme } from '../../ui/theme/theme';
import { Button, IconBtn, Input, T } from '../../ui/ui';
import { diagnosticMonitor } from '../../diagnostics/monitor';
import { ProjectSwitcher } from './Menus';

export function TopBar({ query, onQuery, onNew, mode, onToggleMode, screenTitle, onPickProject }) {
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 1120;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: compact ? 10 : 16, paddingHorizontal: compact ? 16 : 32, minHeight: compact ? 64 : 72,
      borderBottomWidth: 1, borderBottomColor: c.line, backgroundColor: c.surface }}>
      <ProjectSwitcher onPickProject={onPickProject} compact={compact} />
      {!compact ? <>
        <Feather name="chevron-right" size={14} color={c.faint} />
        <T size={13} color={c.muted} numberOfLines={1} style={{ flexShrink: 1 }}>{screenTitle}</T>
        <View style={{ flex: 1 }} />
      </> : null}
      <View style={{ flex: 1, maxWidth: compact ? 240 : 320, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: c.bg, borderWidth: 1, borderColor: c.line, borderRadius: radius.sm, paddingHorizontal: 12 }}>
        <Feather name="search" size={16} color={c.muted} />
        <Input value={query} onChangeText={onQuery} accessibilityLabel="Search tasks" placeholder="Search tasks"
          style={{ flex: 1, backgroundColor: 'transparent', borderWidth: 0, paddingHorizontal: 0, minHeight: 38 }} />
      </View>
      <IconBtn icon={mode !== 'light' ? 'sun' : 'moon'} label="Toggle theme" onPress={onToggleMode} />
      {compact ? <IconBtn icon="plus" label="New task" solid onPress={onNew} />
        : <Button label="New task" icon="plus" small onPress={onNew} />}
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
          style={({pressed})=>({flex:1, minHeight:56, borderRadius:9, alignItems:'center', justifyContent:'center', gap:3, backgroundColor:on?c.surfaceAlt:'transparent', opacity:pressed?0.65:1})}>
          <View style={k === 'timeline' ? { transform: [{ rotate: '90deg' }] } : undefined}><Feather name={i} size={19} color={on?c.accent:c.muted}/></View>
          <T size={11} weight={on?'600':'500'} color={on?c.ink:c.muted} numberOfLines={1}>{l}</T>
        </Pressable>;
      })}
    </View>
  );
}
