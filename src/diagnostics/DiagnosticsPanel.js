import { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Button, Card, SectionTitle, Sheet, T } from '../ui';
import { useTheme } from '../theme';
import { diagnosticMonitor as monitor } from './monitor';

// Read only when Settings is visible; normal diagnostic events do not cause
// application-wide re-renders or new timers while navigating other screens.
export default function DiagnosticsPanel() {
  const { c } = useTheme();
  const [snap, setSnap] = useState(() => monitor.snapshot());
  const [open, setOpen] = useState('');
  const [copied, setCopied] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  useEffect(() => monitor.subscribe(() => setSnap(monitor.snapshot())), []);
  const view = (kind) => { setSnap(monitor.snapshot()); setOpen(kind); setCopied(''); };
  const report = open === 'crash' ? monitor.crashReport() : monitor.performanceReport();
  const copy = async () => {
    try { await Clipboard.setStringAsync(report); setCopied('Copied to clipboard'); }
    catch { setCopied('Copy failed. Select the report text below to copy manually.'); }
  };
  return <>
    <Card style={{ gap: 12 }}>
      <SectionTitle>Diagnostics</SectionTitle>
      <T size={12} muted>Local crash and performance reports, similar to RIVNA DevTools. No network upload, no task contents or credentials. Data stays on this device until cleared.</T>
      <View style={{flexDirection:'row',gap:8,flexWrap:'wrap'}}>
        <Button small label="Crash reports" icon="alert-circle" variant="secondary" onPress={() => view('crash')} />
        <Button small label="Performance monitor" icon="activity" variant="secondary" onPress={() => view('perf')} />
      </View>
      <T size={12} muted>{snap.crashes.length} recorded JS exception{snap.crashes.length===1?'':'s'} · {snap.freezeMs || 0}ms longest observed JS stall · {snap.slow.length} slow events · current screen: {snap.screen}</T>
      <T size={11} muted>Native crashes, memory kills and Expo Go restarts cannot be confirmed by JavaScript diagnostics alone. Use Android logs for those cases.</T>
      {confirmClear ? <View style={{ flexDirection:'row',gap:8,flexWrap:'wrap' }}>
        <Button label="Confirm clear" small variant="danger" onPress={() => {monitor.clear();setConfirmClear(false);setSnap(monitor.snapshot());}} />
        <Button label="Cancel" small variant="ghost" onPress={() => setConfirmClear(false)} />
      </View> : <Button label="Clear local diagnostics" icon="trash-2" small variant="ghost" onPress={() => setConfirmClear(true)} />}
    </Card>
    <Sheet visible={!!open} onClose={() => setOpen('')} title={open==='crash'?'Crash reports':'Performance monitor'} footer={
      <><Button label="Copy report" icon="copy" small onPress={copy}/>
        <Button label="Close" small variant="secondary" onPress={() => setOpen('')}/></>
    }>
      <T size={12} muted>Use Copy report to share a sanitized technical report. The text is also selectable.</T>
      {copied ? <T size={12} color={c.accent}>{copied}</T> : null}
      <TextInput multiline editable selectTextOnFocus showSoftInputOnFocus={false}
        value={report} onChangeText={() => {}}
        accessibilityLabel="Selectable diagnostics report"
        style={{fontFamily:'monospace',fontSize:11,color:c.ink,backgroundColor:c.surfaceAlt,
          borderRadius:12,padding:12,minHeight:270,textAlignVertical:'top'}} />
    </Sheet>
  </>;
}
