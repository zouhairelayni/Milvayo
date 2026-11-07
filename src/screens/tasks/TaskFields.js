// /src/screens/tasks/TaskFields.js
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import InlineEditor from '../../components/inline/InlineEditor';
import { Button, InlineDateField, Input, T } from '../../ui/ui';
import { useTheme } from '../../ui/theme/theme';
import '../../timeline/gantt.cjs';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
export const Field = ({ label, children }) => (
  <View style={{ gap: 8 }}>
    <T size={12} weight="500" muted>{label}</T>
    {children}
  </View>
);

// Native-friendly inline dropdown: the property and its current value remain visible.
// Only its editor expands, directly under that row, so task details stay discoverable.
export function InlineDrop({ id, label, summary, open, onToggle, children }) {
  const { c } = useTheme();
  const expanded = open === id;
  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: c.line }}>
      <Pressable
        onPress={() => onToggle(expanded ? null : id)}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${summary || 'not set'}`}
        accessibilityState={{ expanded }}
        style={({ pressed }) => ({
          minHeight: 56, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
          opacity: pressed ? 0.65 : 1,
        })}
      >
        <T size={13} weight="500" muted style={{ flex: 1, minWidth: 80 }}>{label}</T>
        <T size={13} weight="500" numberOfLines={1} style={{ flex: 1.6, textAlign: 'right' }}>{String(summary || 'Not set')}</T>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={17} color={c.muted} />
      </Pressable>
      <InlineEditor expanded={expanded} style={{ gap: 10, paddingBottom: 14, paddingTop: 3 }}>{children}</InlineEditor>
    </View>
  );
}

export function DateField({label,value,onValid}){
 return <InlineDateField label={label} value={value} onChange={onValid}/>;
}

export function CustomValueInput({value,type,onSave}){
 const [draft,setDraft]=useState(String(value??''));
 useEffect(()=>setDraft(String(value??'')),[value]);
 return <View style={{gap:7}}>{type==='date'?<InlineDateField label="Date value" value={draft} onChange={setDraft}/>:<Input value={draft} onChangeText={setDraft} placeholder={type} keyboardType={type==='number'?'numeric':undefined}/>}<Button label="Save value" small variant="secondary" onPress={()=>onSave(type==='number'?(draft===''?null:Number(draft)):draft)}/></View>;
}
