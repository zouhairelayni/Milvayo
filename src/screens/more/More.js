// /src/screens/more/More.js
import { useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, useTheme } from '../../ui/theme/theme';
import { Input, ScreenIntro, T, useLayoutPreference } from '../../ui/ui';
import { WorkspaceSwitcher } from '../../components/shell/Menus';
import { moreGroups } from '../../app/navigation/sections.cjs';
import { useProjectTools } from '../../store/useProjectTools';
import ProjectToolsSheet from './ProjectToolsSheet';
const {requestTour}=require('../onboarding/tourEvents.cjs');

const MODE_LABEL = { light: 'Light', dark: 'Dark', amoled: 'AMOLED' };
const NEXT_MODE = { light: 'dark', dark: 'amoled', amoled: 'light' };

function Row({ icon, label, value, onPress, last }) {
  const { c } = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={value ? `${label}, ${value}` : label} onPress={onPress}
    style={({ pressed }) => ({ flexDirection:'column',alignItems:'flex-start',justifyContent:'space-between',gap:12,minHeight:92,padding:12,flexBasis:'29%',flexGrow:1,borderRadius:16,borderWidth:0,borderColor:c.line,backgroundColor:pressed?c.selection:c.surface })}>
    <Feather name={icon} size={18} color={c.ink} />
    <T weight="500" style={{ flex: 1 }}>{label}</T>
    {value ? <T size={12} muted>{value}</T> : null}

  </Pressable>;
}

function Group({ title, children }) {
  const { c } = useTheme();
  return <View style={{ gap: 8 }}>
    <T size={16} weight="600" style={{paddingHorizontal:4}}>{title}</T>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:10}}>{children}</View>
  </View>;
}

// Everything the bottom bar does not show: the project's optional tools (with the switches), the rest of the old menu,
// the workspace switcher and the appearance toggle.
export default function More({ go, onPickProject }) {
  const { mode, setPref } = useTheme();
  const { setPreference } = useLayoutPreference();
  const tools = useProjectTools();
  const [managing, setManaging] = useState(false);
  const [query,setQuery]=useState('');
  const web = Platform.OS === 'web';
  return <ScrollView contentContainerStyle={{padding:16,paddingBottom:40,gap:24}} showsVerticalScrollIndicator={false}>
    <ScreenIntro title="Your workspace" description="Tools for delivery, people and the way you work."/>
    <WorkspaceSwitcher onPickProject={onPickProject} />
    <Input value={query} onChangeText={setQuery} placeholder="Find a workspace tool" accessibilityLabel="Find a workspace tool"/>
    {moreGroups(tools).map(g => {
      const app = g.group === 'App';
      const manage = g.group === 'Project tools';
      return <Group key={g.group} title={g.group}>
        {g.items.filter(([,label])=>label.toLowerCase().includes(query.toLowerCase())).map(([k, label, icon], n) => <Row key={k} icon={icon} label={label} last={!manage && !app && n === g.items.length - 1} onPress={() => go(k)} />)}
        {manage ? <Row icon="sliders" label="Manage tools" last onPress={() => setManaging(true)} /> : null}
        {app ? <Row icon="compass" label="Take the tour" last={false} onPress={requestTour}/> : null}
        {app ? <Row icon={mode === 'light' ? 'sun' : 'moon'} label="Appearance" value={MODE_LABEL[mode]} last={!web} onPress={() => setPref(NEXT_MODE[mode] || 'light')} /> : null}
        {app && web ? <Row icon="monitor" label="Desktop layout" last onPress={() => setPreference('desktop')} /> : null}
      </Group>;
    })}
    <ProjectToolsSheet visible={managing} onClose={() => setManaging(false)} />
  </ScrollView>;
}
