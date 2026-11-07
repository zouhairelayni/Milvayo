// /src/components/shell/Bars.js
import { useRef, useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, useTheme } from '../../ui/theme/theme';
import { Button, IconBtn, Input, Segmented, T } from '../../ui/ui';
import { diagnosticMonitor } from '../../diagnostics/monitor';
import NavIcon from './NavIcon';
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

function CanvasHeader({controls}) {
 const {c}=useTheme(),[sideWidth,setSideWidth]=useState(96);
 return <View style={{flexDirection:'row',alignItems:'center',paddingHorizontal:12,paddingVertical:8,minHeight:60,backgroundColor:c.bg}}>
  <View style={{width:sideWidth,alignItems:'flex-start'}}><IconBtn icon="chevron-left" label="Go back" onPress={controls.onBack}/></View>
  <T size={18} weight="600" numberOfLines={2} style={{flex:1,minWidth:0,textAlign:'center'}}>{controls.title}</T>
  <View style={{width:sideWidth,alignItems:'flex-end'}}><View onLayout={e=>{const width=Math.max(44,Math.ceil(e.nativeEvent.layout.width));setSideWidth(old=>old===width?old:width);}} style={{flexDirection:'row',alignSelf:'flex-end'}}>{controls.trailing}</View></View>
 </View>;
}

export function TopBar({ query, onQuery, onNew, onPickProject, controls, showProjectName = true }) {
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 1120;
  if(controls?.canvas)return <CanvasHeader controls={controls}/>;
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
      style={{ flexDirection:'row', backgroundColor:c.dock, marginHorizontal:12,marginTop:4,marginBottom:8,borderRadius:24,borderWidth:1,borderColor:c.line,paddingHorizontal:6,paddingTop:6,paddingBottom:6 }}>
      {items.map(([k,l,i]) => {
        if (k === 'create') return <View key={k} style={{ flex:1, minHeight:56, alignItems:'center', justifyContent:'center' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Create" onPress={onCreate} hitSlop={4}
            style={({pressed})=>({ width:48, height:48, borderRadius:16, alignItems:'center', justifyContent:'center', backgroundColor:c.accent, opacity:pressed?0.8:1 })}>
            <Feather name="plus" size={22} color={c.accentInk} />
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
          <NavIcon name={i} selected={on} color={on?c.accent:c.muted}/>
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

// The screen's own header actions; Timeline presets live in Timeline options.
function HeaderIcons({ controls }) {
  if (!controls) return null;
  return controls.actions?.map(item => <IconBtn key={item.label} icon={item.icon || 'more-horizontal'} label={item.label} onPress={item.onPress} />) || null;
}

// Phone header. kind 'main': project switcher, search, screen controls. 'hub': the More title. 'sub': back to More + screen name.
export function PhoneHeader({ kind, title, query, onQuery, controls, onPickProject, onBack, showProjectName = true }) {
  const { c } = useTheme();
  const [searching, setSearching] = useState(false);
  const row = { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, minHeight: 60 };
  if(controls?.canvas)return <CanvasHeader controls={controls}/>;
  if (kind === 'hub') return null;
  if (kind === 'sub') return <View style={row}>
    <IconBtn icon="chevron-left" label="Go back" onPress={onBack} />
    <View style={{flex:1}}/>
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
    <ProjectSwitcher onPickProject={onPickProject} compact showProjectName={false} />
    <View style={{flex:1}}/>
    <IconBtn icon="search" label="Search tasks" onPress={() => setSearching(true)} />
    <HeaderIcons controls={controls} />
  </View>;
}
