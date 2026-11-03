// /src/ui/uiLayout.js
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { radius, useTheme } from './theme/theme';
import { Card, T, useWide } from './uiBase';
import { IconBtn } from './uiControls';
import InlineNotice from '../components/notice/InlineNotice';

// Bottom sheet on phones, right-hand drawer on wide screens.
export function Sheet({ visible, onClose, title, children, footer, showNotice = true }) {
  const { c, mode } = useTheme();
  const wide = useWide();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaProvider style={{ flex: 1 }}>
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: mode !== 'light' ? 'rgba(0,0,0,0.6)' : 'rgba(27,25,21,0.35)' }}>
      <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column', justifyContent: 'flex-end', backgroundColor: mode !== 'light' ? 'rgba(0,0,0,0.6)' : 'rgba(27,25,21,0.35)' }}>
        <Pressable onPress={onClose} style={{ flex: 1 }} />
        <View
          style={{
            width: wide ? 560 : '100%',
            maxHeight: wide ? undefined : '92%',
            flex: wide ? 1 : undefined,
            backgroundColor: c.bg,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: wide ? 0 : radius.lg,
            borderLeftWidth: wide ? 1 : 0,
            borderColor: c.line,
            overflow: 'hidden',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 }}>
            <T size={20} weight="600">{title}</T>
            <IconBtn icon="x" onPress={onClose} label="Close" />
          </View>
          {showNotice ? <View style={{ paddingHorizontal: 20, paddingTop: 8 }}><InlineNotice /></View> : null}
          <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 12, gap: 18, paddingBottom: 48 }}>{children}</ScrollView>
          {footer ? (
            <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: c.line, flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>{footer}</View>
          ) : null}
        </View>
      </View>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

// Standard screen frame: serif title, optional actions, responsive gutter.
export function Page({ title, subtitle, actions, children, scrollRef, onScroll, scrollEnabled = true, scrollProps }) {
  const wide = useWide();
  return (
    <ScrollView ref={scrollRef} onScroll={onScroll} scrollEventThrottle={16} scrollEnabled={scrollEnabled} {...scrollProps} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: wide ? 32 : 16, paddingTop: wide ? 28 : 16, paddingBottom: wide ? 72 : 96 }}>
      <View style={{ width: '100%', minWidth: 0, alignSelf: 'stretch', gap: wide ? 22 : 16 }}>
        {(wide || subtitle || actions) ? (
          <View style={{ flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'center' : 'stretch', justifyContent: 'space-between', gap: wide ? 20 : 12, width: '100%', paddingBottom: wide ? 6 : 0 }}>
            <View style={{ minWidth: 0, flex: wide ? 1 : undefined, alignSelf: 'stretch', gap: wide ? 6 : 0 }}>
              {wide ? <T size={30} weight="600">{title}</T> : null}
              {subtitle ? <T muted size={wide ? 13 : 12} style={{ lineHeight: wide ? 21 : 19, flexShrink: 1 }}>{subtitle}</T> : null}
            </View>
            {actions ? <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: wide ? 'flex-end' : 'flex-start', flexWrap: 'wrap', gap: 8, flexShrink: 0, maxWidth: '100%' }}>{actions}</View> : null}
          </View>
        ) : null}
        {children}
      </View>
    </ScrollView>
  );
}

export function Grid({ children, gap = 12 }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap, width: '100%' }}>{children}</View>;
}

// A grid cell: `wide` basis on large screens, `mobile` basis on phones.
export function Cell({ children, wide: wBasis = '48%', mobile = '100%' }) {
  const isWide = useWide();
  return <View style={{ flexBasis: isWide ? wBasis : mobile, flexGrow: 1, flexShrink: 1, minWidth: isWide ? 240 : 0 }}>{children}</View>;
}

export function Stat({ label, value, hint, accent, onPress }) {
  return (
    <Card pad={20} style={{ gap: 9, minHeight: 116 }} onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {accent ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accent }} /> : null}
        <T size={12} weight="600" muted>{label}</T>
      </View>
      <T size={34} weight="600" style={{ letterSpacing: -0.7, fontVariant: ['tabular-nums'] }}>{value}</T>
      {hint ? <T size={12} muted>{hint}</T> : null}
    </Card>
  );
}

export function SectionTitle({ children, right }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <T size={16} weight="600">{children}</T>
      {right}
    </View>
  );
}

export function Empty({ children }) {
  return (
    <View style={{ padding: 28, alignItems: 'center' }}>
      <T muted center>{children}</T>
    </View>
  );
}
