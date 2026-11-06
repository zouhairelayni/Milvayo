// /src/screens/more/More.js
import { useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, useTheme } from '../../ui/theme/theme';
import { ScreenIntro, T, useLayoutPreference } from '../../ui/ui';
import { Brand, WorkspaceSwitcher } from '../../components/shell/Menus';
import { moreGroups } from '../../app/navigation/sections.cjs';
import { useProjectTools } from '../../store/useProjectTools';
import ProjectToolsSheet from './ProjectToolsSheet';

const MODE_LABEL = { light: 'Light', dark: 'Dark', amoled: 'AMOLED' };
const NEXT_MODE = { light: 'dark', dark: 'amoled', amoled: 'light' };

function Row({ icon, label, value, onPress, last }) {
  const { c } = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={value ? `${label}, ${value}` : label} onPress={onPress}
    style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingHorizontal: 14,
      borderBottomWidth: last ? 0 : 1, borderBottomColor: c.line, backgroundColor: pressed ? c.surfaceAlt : 'transparent' })}>
    <Feather name={icon} size={18} color={c.muted} />
    <T weight="500" style={{ flex: 1 }}>{label}</T>
    {value ? <T size={12} muted>{value}</T> : null}
    <Feather name="chevron-right" size={16} color={c.faint} />
  </Pressable>;
}

function Group({ title, children }) {
  const { c } = useTheme();
  return <View style={{ gap: 8 }}>
    <T size={12} weight="500" muted style={{ paddingHorizontal: 4 }}>{title}</T>
    <View style={{ borderWidth: 1, borderColor: c.line, borderRadius: radius.md, backgroundColor: c.surface, overflow: 'hidden' }}>{children}</View>
  </View>;
}

// Everything the bottom bar does not show: the project's optional tools (with the switches), the rest of the old menu,
// the workspace switcher and the appearance toggle.
export default function More({ go }) {
  const { mode, setPref } = useTheme();
  const { setPreference } = useLayoutPreference();
  const tools = useProjectTools();
  const [managing, setManaging] = useState(false);
  const web = Platform.OS === 'web';
  return <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 96, gap: 20 }} showsVerticalScrollIndicator={false}>
    <ScreenIntro title="Workspace tools" description="Manage delivery, governance and the way Milvayo works for you."/>
    <Brand narrow />
    <WorkspaceSwitcher />
    {moreGroups(tools).map(g => {
      const app = g.group === 'App';
      const manage = g.group === 'Project tools';
      return <Group key={g.group} title={g.group}>
        {g.items.map(([k, label, icon], n) => <Row key={k} icon={icon} label={label} last={!manage && !app && n === g.items.length - 1} onPress={() => go(k)} />)}
        {manage ? <Row icon="sliders" label="Manage tools" last onPress={() => setManaging(true)} /> : null}
        {app ? <Row icon={mode === 'light' ? 'sun' : 'moon'} label="Appearance" value={MODE_LABEL[mode]} last={!web} onPress={() => setPref(NEXT_MODE[mode] || 'light')} /> : null}
        {app && web ? <Row icon="monitor" label="Desktop layout" last onPress={() => setPreference('desktop')} /> : null}
      </Group>;
    })}
    <ProjectToolsSheet visible={managing} onClose={() => setManaging(false)} />
  </ScrollView>;
}
