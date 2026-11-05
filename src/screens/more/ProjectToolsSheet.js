// /src/screens/more/ProjectToolsSheet.js
import { Switch, View } from 'react-native';
import { radius, useTheme } from '../../ui/theme/theme';
import { Button, Sheet, T } from '../../ui/ui';
import { useStore } from '../../store/store';
import { useProjectTools } from '../../store/useProjectTools';
const { TOOLS } = require('../../domain/projectTools.cjs');

// One switch per optional tool for the open project. Off hides the screen and its shortcuts; the data stays and comes back.
export default function ProjectToolsSheet({ visible, onClose }) {
  const { c } = useTheme();
  const { s, setProjectTool } = useStore();
  const tools = useProjectTools();
  return <Sheet visible={visible} onClose={onClose} title="Project tools"
    footer={<Button label="Done" small onPress={onClose} />}>
    <T size={13} muted>{`Tools you switch off disappear from ${s.project.name}. Your data stays and returns when you switch a tool back on.`}</T>
    <View style={{ borderWidth: 1, borderColor: c.line, borderRadius: radius.md, overflow: 'hidden' }}>
      {TOOLS.map((tool, n) => <View key={tool.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingVertical: 8, paddingHorizontal: 14,
        borderTopWidth: n ? 1 : 0, borderTopColor: c.line }}>
        <View style={{ flex: 1, gap: 2 }}>
          <T weight="600">{tool.label}</T>
          <T size={12} muted>{tool.hint}</T>
        </View>
        <Switch value={tools[tool.id]} onValueChange={on => setProjectTool(tool.id, on)} accessibilityLabel={`${tool.label} tool`}
          trackColor={{ false: c.line, true: c.accent }} thumbColor="#FFFFFF" />
      </View>)}
    </View>
  </Sheet>;
}
