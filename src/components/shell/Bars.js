// /src/components/shell/Bars.js
import { useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, useTheme } from '../../ui/theme/theme';
import { Button, IconBtn, Input, Segmented, T } from '../../ui/ui';
import { diagnosticMonitor } from '../../diagnostics/monitor';
import { ProjectSwitcher } from './Menus';
import { swipeStep } from '../../app/navigation/sections.cjs';

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

export function TopBar({ query, onQuery, onNew, onPickProject, controls, showProjectName = true }) {
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 1120;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: compact ? 8 : 12, paddingHorizontal: compact ? 16 : 28,
      minHeight: compact ? 64 : 72, paddingVertical: compact ? 10 : 14,
      backgroundColor: c.bg }}>
      <ProjectSwitcher onPickProject={onPickProject} compact={compact} showProjectName={showProjectName} />
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

// One horizontal swipe handler for the bar and the pill. `swipedAt` lets the buttons ignore the tap a swipe can end in.
function useSwipe(ids, current, go) {
  const start = useRef(null);
  const swipedAt = useRef(0);
  return {
    swipedAt,
    onStart: e => { const p = e.nativeEvent.touches?.[0]; start.current = p ? { x: p.pageX, y: p.pageY } : null; },
    onEnd: e => {
      const p = e.nativeEvent.changedTouches?.[0], a = start.current;
      start.current = null;
      if (!p || !a) return;
      const next = swipeStep(ids, current, p.pageX - a.x, p.pageY - a.y);
      if (!next) return;
      swipedAt.current = Date.now();
      go(next);
    },
  };
}

// Phone bottom bar: Home, Work, a centre Create button, Projects, More. Swiping the bar moves between the four sections.
export function TabBar({ tabs, current, go, intent, onCreate }) {
  const touches = useRef({});
  const swipe = useSwipe(tabs.map(([k]) => k), current, go);
  const { c } = useTheme();
  const items = onCreate ? [...tabs.slice(0, 2), ['create'], ...tabs.slice(2)] : tabs;
  return (
    <View onTouchStart={swipe.onStart} onTouchEnd={swipe.onEnd}
      style={{ flexDirection:'row', backgroundColor:c.surface, paddingHorizontal:8, paddingTop:7, paddingBottom:Platform.OS==='ios'?12:7 }}>
      {items.map(([k,l,i]) => {
        if (k === 'create') return <View key={k} style={{ flex:1, minHeight:56, alignItems:'center', justifyContent:'center' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Create" onPress={onCreate} hitSlop={4}
            style={({pressed})=>({ width:52, height:42, borderRadius:radius.sm, alignItems:'center', justifyContent:'center', backgroundColor:c.accent, opacity:pressed?0.8:1 })}>
            <Feather name="plus" size={22} color="#FFFFFF" />
          </Pressable>
        </View>;
        const on=current===k;
        return <Pressable key={k} accessibilityRole="tab" accessibilityLabel={l} accessibilityState={{selected:on}} pressRetentionOffset={0} onPressIn={(e)=>{ touches.current[k] = {...intent.begin(k), at: e.nativeEvent.timestamp ?? e.timeStamp}; }} onPress={(e)=>{
          const press = touches.current[k]; delete touches.current[k];
          if(Date.now()-swipe.swipedAt.current<450)return;
          if (!intent.accept(press,k)) { diagnosticMonitor.recordAction(`ignored stale tab press: ${k}`); return; }
          diagnosticMonitor.recordAction(`tab input: ${k}; down=${press.at}; up=${e.nativeEvent.timestamp ?? e.timeStamp}`);
          go(k);
        }}
          style={({pressed})=>({flex:1, minHeight:56, alignItems:'center', justifyContent:'center', gap:3, opacity:pressed?0.65:1})}>
          <View style={{width:28,height:28,alignItems:'center',justifyContent:'center'}}><Feather name={i} size={on?24:19} color={on?c.accent:c.muted}/></View>
          <T size={11} weight={on?'600':'500'} color={on?c.ink:c.muted} numberOfLines={1}>{l}</T>
        </Pressable>;
      })}
    </View>
  );
}

// The views of one section (Work: Board, List, Timeline, Sprints). Swiping the pill steps between them.
export function ViewPill({ views, current, go }) {
  const swipe = useSwipe(views.map(([k]) => k), current, go);
  return <View onTouchStart={swipe.onStart} onTouchEnd={swipe.onEnd} style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 }}>
    <Segmented fill options={views.map(([value, label]) => ({ value, label }))} value={current}
      onChange={value => { if (Date.now() - swipe.swipedAt.current >= 450) go(value); }} />
  </View>;
}

const ZOOMS = ['Days', 'Weeks', 'Months'];

// The screen's own header controls as icons: Board and Tasks Tools, New sprint, New release, Timeline zoom (one tap cycles).
function HeaderIcons({ controls }) {
  const { c } = useTheme();
  if (!controls) return null;
  if (controls.kind === 'zoom') {
    const next = ZOOMS[(ZOOMS.indexOf(controls.value) + 1) % ZOOMS.length];
    return <Pressable accessibilityRole="button" accessibilityLabel={`Zoom ${controls.value}. Change to ${next}`} onPress={() => controls.onChange(next)} hitSlop={4}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 10, borderRadius: radius.sm, backgroundColor: c.surfaceAlt, opacity: pressed ? 0.7 : 1 })}>
      <Feather name="zoom-in" size={15} color={c.ink} />
      <T size={12} weight="600">{controls.value}</T>
    </Pressable>;
  }
  return controls.actions?.map(item => <IconBtn key={item.label} icon={item.icon || 'more-horizontal'} label={item.label} onPress={item.onPress} />) || null;
}

// Phone header. kind 'main': project switcher, search, screen controls. 'hub': the More title. 'sub': back to More + screen name.
export function PhoneHeader({ kind, title, query, onQuery, controls, onPickProject, onBack, showProjectName = true }) {
  const { c } = useTheme();
  const [searching, setSearching] = useState(false);
  const row = { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, minHeight: 60 };
  if (kind === 'hub') return null;
  if (kind === 'sub') return <View style={row}>
    <IconBtn icon="chevron-left" label="Back to More" onPress={onBack} />
    <View style={{ flex: 1 }} />
    <HeaderIcons controls={controls} />
  </View>;
  if (searching) return <View style={row}>
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: c.line, borderRadius: radius.sm, paddingHorizontal: 12, height: 44 }}>
      <Feather name="search" size={16} color={c.muted} />
      <Input value={query} onChangeText={onQuery} autoFocus accessibilityLabel="Search tasks" placeholder="Search tasks"
        style={{ flex: 1, backgroundColor: 'transparent', borderWidth: 0, paddingHorizontal: 0, height: 42, minHeight: 42, paddingVertical: 0 }} />
    </View>
    <IconBtn icon="x" label="Close search" onPress={() => { onQuery(''); setSearching(false); }} />
  </View>;
  return <View style={row}>
    <View style={{ flex: 1, minWidth: 0, flexDirection: 'row' }}><ProjectSwitcher onPickProject={onPickProject} compact showProjectName={showProjectName} /></View>
    <IconBtn icon="search" label="Search tasks" onPress={() => setSearching(true)} />
    <HeaderIcons controls={controls} />
  </View>;
}
