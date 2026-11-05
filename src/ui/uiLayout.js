// /src/ui/uiLayout.js
import { useRef } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { radius, useTheme } from './theme/theme';
import { Card, T, useWide } from './uiBase';
import InlineNotice from '../components/notice/InlineNotice';

// Bottom sheet on phones, right-hand drawer on wide screens.
export function Sheet({ visible, onClose, title, children, footer, showNotice = true, compact = false }) {
  const { c, mode } = useTheme();
  const wide = useWide();
  const touch = useRef(null);
  const bodyRef = useRef(null);
  const scrollY = useRef(0);
  const startSwipe = e => { const t=e.nativeEvent.touches?.[0]; touch.current=t?{x:t.pageX,y:t.pageY,scrollY:scrollY.current}:null; };
  const finishSwipe = e => {
    const start=touch.current; touch.current=null;
    const t=e.nativeEvent.changedTouches?.[0];
    if (!start || !t || start.scrollY>2 || scrollY.current>2) return;
    const dx=t.pageX-start.x, dy=t.pageY-start.y;
    if (dy>110 && dy>Math.abs(dx)*1.4) onClose();
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} onShow={() => { scrollY.current=0; bodyRef.current?.scrollTo({y:0,animated:false}); }}>
      <SafeAreaProvider style={{ flex: 1 }}>
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: mode !== 'light' ? 'rgba(0,0,0,0.6)' : 'rgba(27,25,21,0.35)' }}>
      <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column', justifyContent: compact && wide ? 'center' : 'flex-end', alignItems: compact && wide ? 'center' : undefined, backgroundColor: mode !== 'light' ? 'rgba(0,0,0,0.6)' : 'rgba(27,25,21,0.35)' }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Dismiss ${title || 'sheet'}`} onPress={onClose} style={compact ? { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } : { flex: 1 }} />
        <View onTouchStart={startSwipe} onTouchEnd={finishSwipe} accessibilityViewIsModal onAccessibilityEscape={onClose}
          style={{
            width: compact && wide ? 420 : wide ? 560 : '100%',
            maxWidth: compact && wide ? '90%' : undefined,
            maxHeight: compact ? '76%' : wide ? undefined : '92%',
            flex: wide && !compact ? 1 : undefined,
            backgroundColor: c.bg,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: wide && !compact ? 0 : radius.lg,
            borderBottomLeftRadius: compact && wide ? radius.lg : 0,
            borderBottomRightRadius: compact && wide ? radius.lg : 0,
            borderWidth: compact && wide ? 1 : 0,
            borderLeftWidth: wide ? 1 : 0,
            borderColor: c.line,
            overflow: 'hidden',
          }}
        >
          <View style={{alignItems:'center',paddingTop:9,paddingBottom:7}}><View accessibilityLabel="Swipe down to dismiss" style={{width:38,height:5,borderRadius:3,backgroundColor:c.faint,opacity:.65}} /></View>
          <View style={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 }}>
            <T size={20} weight="600" accessibilityRole="header">{title}</T>
          </View>
          {showNotice ? <View style={{ paddingHorizontal: 20, paddingTop: 8 }}><InlineNotice /></View> : null}
          <ScrollView ref={bodyRef} style={compact ? { flexGrow: 0, flexShrink: 1 } : undefined} keyboardShouldPersistTaps="handled" scrollEventThrottle={16} onScroll={e=>{scrollY.current=e.nativeEvent.contentOffset.y;}} contentContainerStyle={{ padding: 24, paddingTop: 12, gap: 18, paddingBottom: 48 }}>{children}</ScrollView>
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
export function Page({ title, subtitle, actions, children, scrollRef, onScroll, scrollEnabled = true, scrollProps, topPadding }) {
  const wide = useWide();
  return (
    <ScrollView ref={scrollRef} onScroll={onScroll} scrollEventThrottle={16} scrollEnabled={scrollEnabled} {...scrollProps} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: wide ? 32 : 16, paddingTop: topPadding ?? (wide ? 24 : 16), paddingBottom: wide ? 72 : 96 }}>
      <View style={{ width: '100%', minWidth: 0, alignSelf: 'stretch', gap: wide ? 22 : 16 }}>
        {actions ? <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>{actions}</View> : null}
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
    <Card pad={20} style={{ gap: 9, minHeight: 116 }} onPress={onPress} accessibilityLabel={`${label}, ${value}`}>
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
      <T size={16} weight="600" style={{ flexShrink: 1 }}>{children}</T>
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
