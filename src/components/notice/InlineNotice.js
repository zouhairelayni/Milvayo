// /src/components/notice/InlineNotice.js
import { useRef } from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { T } from '../../ui/ui';
import { useStore } from '../../store/store';
import { useTheme } from '../../ui/theme/theme';
import { inlineErrorText } from './inlineNotice.cjs';

// Shows the store's current error notice inside a native Modal surface (Task Sheet, phone side menu), where the island is hidden.
export default function InlineNotice() {
  const { c } = useTheme();
  const { notice, dismissNotice } = useStore();
  const ignored = useRef(notice?.id);
  const text = inlineErrorText(notice, ignored.current);
  if (!text) return null;
  return (
    <View accessibilityLiveRegion="polite" style={{ width: '100%', flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#D9573B', backgroundColor: c.surfaceAlt }}>
      <Feather name="alert-circle" size={16} color="#D9573B" />
      <T size={13} style={{ flex: 1, minWidth: 0 }}>{text}</T>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss message" onPress={dismissNotice} hitSlop={12}><Feather name="x" size={16} color={c.muted} /></Pressable>
    </View>
  );
}
