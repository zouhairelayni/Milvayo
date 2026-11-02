// /src/ui/uiLayout.js
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { radius, useTheme } from './theme/theme';
import { Card, T, useWide } from './uiBase';
import { IconBtn } from './uiControls';

// Bottom sheet on phones, right-hand drawer on wide screens.
export function Sheet({ visible, onClose, title, children, footer }) {
  const { c, mode } = useTheme();
  const wide = useWide();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaProvider style={{ flex: 1 }}>
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(27,25,21,0.35)' }}>
      <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column', justifyContent: 'flex-end', backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(27,25,21,0.35)' }}>
        <Pressable onPress={onClose} style={{ flex: 1 }} />
        <View
          style={{
            width: wide ? 540 : '100%',
            maxHeight: wide ? undefined : '90%',
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
            <T serifFace size={22}>{title}</T>
            <IconBtn icon="x" onPress={onClose} label="Close" />
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 18, paddingBottom: 40 }}>{children}</ScrollView>
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
    <ScrollView ref={scrollRef} onScroll={onScroll} scrollEventThrottle={16} scrollEnabled={scrollEnabled} {...scrollProps} style={{ flex: 1 }} contentContainerStyle={{ padding: wide ? 32 : 16, paddingBottom: 130 }}>
      <View style={{ width: '100%', maxWidth: 1180, alignSelf: 'center', gap: wide ? 18 : 13 }}>
        {(wide || subtitle || actions) ? (
          <View style={{ flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'flex-end' : 'stretch', justifyContent: 'space-between', gap: wide ? 12 : 10, width: '100%' }}>
            <View style={{ minWidth: 0, flex: wide ? 1 : undefined, alignSelf: 'stretch', gap: wide ? 6 : 0 }}>
              {wide ? <T serifFace size={38} weight="500">{title}</T> : null}
              {subtitle ? <T muted size={wide ? 14 : 12} style={{ lineHeight: wide ? 21 : 19, flexShrink: 1 }}>{subtitle}</T> : null}
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
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>{children}</View>;
}

// A grid cell: `wide` basis on large screens, `mobile` basis on phones.
export function Cell({ children, wide: wBasis = '48%', mobile = '100%' }) {
  const isWide = useWide();
  return <View style={{ flexBasis: isWide ? wBasis : mobile, flexGrow: 1, flexShrink: 1 }}>{children}</View>;
}

export function Stat({ label, value, hint, accent, onPress }) {
  return (
    <Card pad={16} style={{ gap: 6 }} onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {accent ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accent }} /> : null}
        <T size={12} weight="600" muted>{label}</T>
      </View>
      <T size={30} weight="600" style={{ letterSpacing: -1 }}>{value}</T>
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
