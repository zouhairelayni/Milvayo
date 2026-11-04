// /src/components/notice/IslandNotice.js
import { useCallback, useEffect, useRef, useState } from 'react';
import { PanResponder, Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import NoticeMotion from './NoticeMotion';
import { T } from '../../ui/ui';
import { useTheme } from '../../ui/theme/theme';

const compactLabels = { success: 'Done', error: 'Attention', info: 'Update', warning: 'Warning' };
// In-app Island, not a system-level Dynamic Island. Swipe sideways to dismiss, pull down to expand.
export default function IslandNotice({ notice, onDismiss, onAction, wide = false, topOffset = 12 }) {
  const { c } = useTheme();
  const [display, setDisplay] = useState(null);
  const [stage, setStage] = useState('hidden');
  const [manual, setManual] = useState(false);
  const [fullText, setFullText] = useState(false);
  const timers = useRef([]);
  const hasExpanded = useRef(false);
  const clearTimers = useCallback(() => { timers.current.forEach(clearTimeout); timers.current = []; }, []);
  const later = useCallback((fn, ms) => { timers.current.push(setTimeout(fn, ms)); }, []);
  const currentId = notice?.id;
  useEffect(() => {
    clearTimers();
    hasExpanded.current = false;
    setFullText(false);
    if (!notice) { setStage('hidden'); return; }
    setDisplay(notice);
    setManual(false);
    setStage('compact');
    later(() => setStage('expanded'), 240);
    return clearTimers;
  }, [currentId, clearTimers, later]);
  const dismiss = useCallback(() => {
    clearTimers();
    setStage('hidden');
    later(() => { onDismiss(); setDisplay(null); }, 240);
  }, [onDismiss, clearTimers, later]);
  const act = useCallback(() => {
    if (display?.action && onAction) { onAction(display.action); dismiss(); }
    else { clearTimers(); setManual(true); setStage('expanded'); }
  }, [display, onAction, dismiss, clearTimers]);
  const expand = useCallback(() => {
    clearTimers(); setManual(true);
    if (stage === 'expanded') setFullText(true);
    else setStage('expanded');
  }, [stage, clearTimers]);
  const collapse = useCallback(() => { setManual(true); setFullText(false); setStage('compact'); }, []);
  const gesture = useRef(null);
  gesture.current = (dx, dy) => {
    if (Math.abs(dx) >= 48 && Math.abs(dx) > Math.abs(dy)) dismiss();
    else if (dy >= 42) expand();
    else if (dy <= -42) collapse();
  };
  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => (Math.abs(g.dx) > 16 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2) || (Math.abs(g.dy) > 18 && Math.abs(g.dy) > Math.abs(g.dx) * 1.2),
    onPanResponderTerminationRequest: () => true,
    onPanResponderRelease: (_, g) => gesture.current(g.dx, g.dy),
  })).current;
  useEffect(() => {
    if (!display || stage === 'hidden' || manual || display.sticky) return undefined;
    if (display.type === 'error') return undefined;
    if (stage === 'expanded') {
      const t = setTimeout(() => setStage('compact'), display.type === 'warning' ? 4300 : 3100);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [stage, display?.id, manual]);
  useEffect(() => { if (stage === 'expanded') hasExpanded.current = true; if (stage === 'hidden') hasExpanded.current = false; }, [stage]);
  useEffect(() => {
    if (stage !== 'compact' || !hasExpanded.current || manual || display?.sticky) return undefined;
    const t = setTimeout(dismiss, 1250);
    return () => clearTimeout(t);
  }, [stage, display?.id, manual, dismiss]);
  if (!display) return null;
  const type = compactLabels[display.type] ? display.type : 'info';
  const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : type === 'warning' ? 'alert-triangle' : 'info';
  const ink = '#FFFFFF';
  const heading = display.title || compactLabels[type];
  const expandedHeight = fullText ? 248 : display.text.length > 115 ? 146 : display.text.length > 65 ? 126 : 104;
  const compact = <Pressable accessibilityRole="button" accessibilityLabel={display.action ? `${heading}. Open Backup` : `${heading}, expand notification`} onPress={act} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, height: '100%' }}>
    <Feather name={icon} size={15} color={ink}/>
    <T size={12} weight="700" color={ink} numberOfLines={1}>{heading}</T>
  </Pressable>;
  const expanded = <View accessibilityLiveRegion={type === 'error' ? 'assertive' : 'polite'} style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 10 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, minWidth: 0 }}>
      <Feather name={icon} size={21} color={ink}/>
      <Pressable accessibilityRole="button" accessibilityLabel={display.action ? 'Open Backup' : 'Expand notification'} onPress={act} style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <T size={13} weight="700" color={ink} numberOfLines={1}>{heading}{display.action ? ' · Open Backup' : ''}</T>
        <T size={12} color={ink} numberOfLines={fullText ? undefined : 3} style={{ lineHeight: 17 }}>{display.text}</T>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss notification" onPress={dismiss} hitSlop={10} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 }}>
        <Feather name="x" size={17} color={ink}/>
      </Pressable>
    </View>
    {display.text.length > 110 && !fullText ? <T size={10} color={ink} style={{ textAlign: 'center', marginTop: 5 }}>Pull down to read full notification</T> : null}
    <Pressable accessibilityRole="button" accessibilityLabel="Collapse notification" hitSlop={12} onPress={collapse} style={{ alignSelf: 'center', paddingTop: 8, paddingHorizontal: 16 }}>
      <Feather name="chevron-up" size={14} color={ink}/>
    </Pressable>
  </View>;
  return <View pointerEvents="box-none" {...pan.panHandlers} style={{ position: 'absolute', top: topOffset, alignSelf: 'center', zIndex: 1000, elevation: 14 }}>
    <NoticeMotion key={display.id} state={stage} compact={compact} expanded={expanded} expandedHeight={expandedHeight} style={{ borderRadius: 38, backgroundColor: c.accent, borderWidth: 1, borderColor: c.line, shadowColor: '#000', shadowOpacity: .3, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 14, overflow: 'hidden' }}/>
  </View>;
}
