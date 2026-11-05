// /src/components/shell/CreateMore.js
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, useTheme } from '../../ui/theme/theme';
import { T } from '../../ui/ui';

// "Create something else" rows at the foot of the Create sheet: a project or a release without leaving the + button.
export default function CreateMore({ onProject, onRelease }) {
  const { c } = useTheme();
  const rows = [['Project', 'folder', onProject], ['Release', 'tag', onRelease]].filter(row => row[2]); // no Release row when the Releases tool is off
  return <View style={{ gap: 8 }}>
    <T weight="600">Create something else</T>
    <View style={{ borderWidth: 1, borderColor: c.line, borderRadius: radius.md, overflow: 'hidden' }}>
      {rows.map(([label, icon, onPress], n) => <Pressable key={label} accessibilityRole="button" accessibilityLabel={`Create ${label.toLowerCase()}`} onPress={onPress}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingHorizontal: 14,
          borderTopWidth: n ? 1 : 0, borderTopColor: c.line, backgroundColor: pressed ? c.surfaceAlt : 'transparent' })}>
        <Feather name={icon} size={17} color={c.muted} />
        <T weight="500" style={{ flex: 1 }}>{label}</T>
        <Feather name="chevron-right" size={16} color={c.faint} />
      </Pressable>)}
    </View>
  </View>;
}
