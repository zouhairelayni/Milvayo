// /src/ui/uiLayout.js
import { Children, Fragment, isValidElement, useRef } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { radius, useTheme } from './theme/theme';
import { Card, T, useWide } from './uiBase';
import InlineNotice from '../components/notice/InlineNotice';
import EmptyArtwork from '../components/illustrations/EmptyArtwork';
import Reveal from './Reveal';
import {IconBtn} from './uiControls';

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
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{flex:1}}><View style={{ flex: 1, flexDirection: wide ? 'row' : 'column', justifyContent: compact && wide ? 'center' : 'flex-end', alignItems: compact && wide ? 'center' : undefined, backgroundColor: mode !== 'light' ? 'rgba(0,0,0,0.6)' : 'rgba(27,25,21,0.35)' }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Dismiss ${title || 'sheet'}`} onPress={onClose} style={compact ? { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } : { flex: 1 }} />
        <Reveal onTouchStart={startSwipe} onTouchEnd={finishSwipe} accessibilityViewIsModal onAccessibilityEscape={onClose}
          {...(Platform.OS === 'web' ? { role: 'dialog', 'aria-modal': true, 'aria-label': title || 'Dialog' } : {})}
          style={{
            width: compact && wide ? 420 : wide ? 560 : '100%',
            maxWidth: compact && wide ? '90%' : undefined,
            maxHeight: compact ? '76%' : wide ? undefined : '92%',
            flex: wide && !compact ? 1 : undefined,
            backgroundColor: c.surface,
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
          <View style={{paddingHorizontal:20,paddingBottom:12,flexDirection:'row',alignItems:'center',gap:12}}>
            <T size={20} weight="600" accessibilityRole="header" style={{flex:1}}>{title}</T>
            <IconBtn icon="x" label={`Close ${title || 'sheet'}`} onPress={onClose}/>
          </View>
          {showNotice ? <View style={{ paddingHorizontal: 20, paddingTop: 8 }}><InlineNotice /></View> : null}
          <ScrollView ref={bodyRef} style={compact ? { flexGrow: 0, flexShrink: 1 } : undefined} keyboardShouldPersistTaps="handled" scrollEventThrottle={16} onScroll={e=>{scrollY.current=e.nativeEvent.contentOffset.y;}} contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 20, paddingBottom: 32 }}>{children}</ScrollView>
          {footer ? (
            <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: c.line, flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>{footer}</View>
          ) : null}
        </Reveal>
      </View></KeyboardAvoidingView>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

// Standard screen frame: serif title, optional actions, responsive gutter.
function containsIntro(children){return Children.toArray(children).some(child=>isValidElement(child)&&(child.type===ScreenIntro||child.type===Fragment&&containsIntro(child.props.children)));}

export function Page({ title, subtitle, actions, children, scrollRef, onScroll, scrollEnabled = true, scrollProps, topPadding, intro=true }) {
  const wide = useWide();
  const showIntro=intro&&title&&!containsIntro(children);
  const Body=intro?Reveal:View;
  return (
    <ScrollView ref={scrollRef} onScroll={onScroll} scrollEventThrottle={16} scrollEnabled={scrollEnabled} {...scrollProps} style={{ flex: 1, minHeight: 0, minWidth: 0 }} contentContainerStyle={{ paddingHorizontal: wide ? 32 : 16, paddingTop: topPadding ?? (wide ? 24 : 16), paddingBottom: wide ? 72 : 96 }}>
      <Body style={{ width: '100%', maxWidth: 1440, minWidth: 0, alignSelf: 'center', gap: wide ? 24 : 20 }}>
        {showIntro ? <ScreenIntro title={title} description={subtitle} action={actions}/> : actions ? <View style={{flexDirection:'row',alignItems:'center',gap:8,flexWrap:'wrap'}}>{actions}</View> : null}
        {children}
      </Body>
    </ScrollView>
  );
}

export function Grid({ children, gap = 12 }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap, width: '100%' }}>{children}</View>;
}

// A grid cell: `wide` basis on large screens, `mobile` basis on phones.
export function Cell({ children, wide: wBasis = '48%', mobile = '100%' }) {
  const isWide = useWide();
  return <View style={{ flexBasis: isWide ? wBasis : mobile, flexGrow: 1, flexShrink: 1, minWidth: isWide ? 160 : 0 }}>{children}</View>;
}

export function Stat({ label, value, hint, accent, onPress }) {
  return (
    <Card pad={20} style={{ gap: 9, minHeight: 116 }} onPress={onPress} accessibilityLabel={`${label}, ${value}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {accent ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accent }} /> : null}
        <T size={12} weight="600" muted>{label}</T>
      </View>
      <T size={28} weight="600" style={{ letterSpacing: -0.7, fontVariant: ['tabular-nums'] }}>{value}</T>
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
    <View style={{ padding: 24, alignItems: 'center',gap:12 }}>
      <EmptyArtwork size={124}/>
      <T muted center>{children}</T>
    </View>
  );
}

// A shared introduction pairs a screen's job with its next action, without another container card.
export function ScreenIntro({ title, description, action }) {
  const wide = useWide();
  return <View style={{ flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'center' : 'stretch', justifyContent: 'space-between', gap: 12 }}>
    <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
      <T size={wide?28:26} weight="600" accessibilityRole="header">{title}</T>
      {description ? <T muted size={13} style={{ maxWidth: 680, lineHeight: 20 }}>{description}</T> : null}
    </View>
    {action ? <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>{action}</View> : null}
  </View>;
}

// Compact, scan-aligned facts let the task content carry the detail, instead of a grid of KPI cards.
export function MetricStrip({ items }) {
  const { c } = useTheme();const wide=useWide();
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', backgroundColor:c.surfaceAlt,borderRadius:16,padding:8,gap:4 }}>
    {items.map(item => <Pressable key={item.label} disabled={!item.onPress} onPress={item.onPress}
      accessibilityRole={item.onPress ? 'button' : undefined} accessibilityLabel={`${item.label}, ${item.value}`}
      style={({ pressed }) => ({ flex: 1, flexBasis:!wide&&items.length===4?'44%':undefined, minWidth:wide?124:76, minHeight:64, paddingHorizontal:wide?12:8, paddingVertical: 8, gap: 4, borderRadius: 8, backgroundColor: pressed ? c.surfaceAlt : 'transparent' })}>
      <T size={12} muted>{item.label}</T>
      <T size={24} weight="600" color={item.color} style={{ fontVariant: ['tabular-nums'] }}>{item.value}</T>
      {item.hint ? <T size={12} muted>{item.hint}</T> : null}
    </Pressable>)}
  </View>;
}
