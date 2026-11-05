// /src/screens/tasks/DueSoon.js
import { useState } from 'react';
import { Pressable } from 'react-native';
import { Button, Card, T } from '../../ui/ui';

export default function DueSoon({ tasks, onOpenTask }) {
  const [expanded, setExpanded] = useState(false);
  return <Card style={{ gap: 8 }}>
    <T weight="600" size={14}>Due soon</T>
    <T muted size={12}>Open tasks due in the next 30 days from the boards enabled in List tools.</T>
    {tasks.length ? tasks.slice(0, expanded ? tasks.length : 1).map(t => (
      <Pressable key={t.id} onPress={() => onOpenTask(t.id)} accessibilityRole="button" accessibilityLabel={`Open task ${t.title}`}
        style={({ pressed }) => ({ flexDirection: 'row', gap: 10, alignItems: 'center', minHeight: 44, opacity: pressed ? 0.6 : 1 })}>
        <T size={12} muted style={{ width: 84 }}>{t.due}</T>
        <T size={13} numberOfLines={2} style={{ flex: 1 }}>{t.title}</T>
      </Pressable>
    )) : <T muted size={12}>Nothing due soon. Set a task due date to see it here.</T>}
    {tasks.length > 1 ? <Button label={expanded ? 'See less' : 'See more'} variant="ghost" onPress={() => setExpanded(v => !v)} /> : null}
  </Card>;
}
