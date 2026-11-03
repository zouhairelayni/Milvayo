// /src/components/inline/MarkdownField.js
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Input, T } from '../../ui/ui';
import TaskMarkdown from './TaskMarkdown';
import { useTheme } from '../../ui/theme/theme';

// Descriptions persist as Markdown source; preview uses the same safe parser as Task Sheet.
export default function MarkdownField({ label = 'Description', value = '', onChangeText, placeholder = 'Purpose and scope', lazy = false, showLabel = true }) {
  const [preview, setPreview] = useState(false);
  const { c } = useTheme();
  return <View style={{ gap: 8 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      {showLabel ? <T size={13} weight="500">{label}</T> : <View/>}
      <Button label={preview ? 'Edit Markdown' : 'Preview'} variant="ghost" small onPress={() => setPreview(v => !v)} />
    </View>
    {preview ? <View accessibilityLabel={`${label} formatted preview`} style={{ minHeight: 104, padding: 12, borderRadius: 9, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface }}>
      {value ? <TaskMarkdown source={value} /> : <T muted size={13}>Nothing to preview yet.</T>}
    </View> : <Input accessibilityLabel={label} value={value} onChangeText={onChangeText} multiline lazy={lazy} placeholder={placeholder} style={{ minHeight: 104 }} />}
    <T size={12} muted>Markdown supported: **bold**, *italic*, headings, lists, quotes and code.</T>
  </View>;
}
