// /src/governance/DiagramExports.js
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { Button, IconBtn, Segmented, Sheet, T, downloadText } from '../ui/ui';
import { useTheme } from '../ui/theme/theme';
import { Scene, sceneToSvg } from './wbsviews';
import { needsSvgCapture, rasterizeDiagram, saveDiagramPng } from './diagramPng';
const { pngPlan, exportSlug } = require('./diagramExport.cjs');

function CaptureSource({ scene, job }) {
  const svgRef = useRef(null), started = useRef(false);
  const ready = useCallback(() => {
    if (started.current) return; started.current = true;
    rasterizeDiagram({ svgRef, plan: job.plan, signal: job.controller.signal, isCurrent: job.isCurrent }).then(job.resolve, job.reject);
  }, [job]);
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={{ width: 72, height: 48, overflow: 'hidden' }}>
    <Scene scene={scene} scale={Math.min(72 / scene.width, 48 / scene.height)} svgRef={svgRef} background={!job.transparent} onReady={ready}/>
  </View>;
}

export default function DiagramExports({ scene, getCSV, name, kind }) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false), [quality, setQuality] = useState('2'), [background, setBackground] = useState('opaque');
  const [busy, setBusy] = useState(false), [feedback, setFeedback] = useState(''), [error, setError] = useState(''), [job, setJob] = useState(null);
  const running = useRef(false), epoch = useRef(0), controller = useRef(null);
  const cancel = useCallback(() => { epoch.current++; controller.current?.abort(); running.current = false; }, []);
  useEffect(() => { setBusy(false); setJob(null); return () => cancel(); }, [scene, cancel]);
  const close = () => { cancel(); setBusy(false); setJob(null); setOpen(false); };
  const plan = scene ? pngPlan(scene, Number(quality), Platform.OS) : null;
  const run = async format => {
    if (running.current) return;
    running.current = true; const token = ++epoch.current;
    const abort = new AbortController(); controller.current = abort;
    const isCurrent = () => token === epoch.current && !abort.signal.aborted;
    setBusy(true); setFeedback(''); setError('');
    try {
      let ok = true;
      const stem = `${exportSlug(name)}-wbs${kind === 'outline' ? '' : '-' + kind}`;
      if (format === 'svg') ok = await downloadText(stem + '.svg', sceneToSvg(scene, c, { transparent: background === 'transparent' }), 'image/svg+xml');
      else if (format === 'csv') ok = await downloadText(`${exportSlug(name)}-wbs.csv`, getCSV(), 'text/csv');
      else {
        const transparent = background === 'transparent';
        const data = needsSvgCapture ? await new Promise((resolve, reject) => {
          const cancelJob = () => reject(Error('Export cancelled'));
          abort.signal.addEventListener('abort', cancelJob, { once: true });
          setJob({ plan, transparent, controller: abort, isCurrent, resolve: value => { abort.signal.removeEventListener('abort', cancelJob); resolve(value); }, reject });
        }) : await rasterizeDiagram({ scene, colors: c, plan, transparent, signal: abort.signal, isCurrent });
        if (!isCurrent()) return;
        await saveDiagramPng(stem + '.png', data);
      }
      if (isCurrent()) { if (ok === false) throw Error('The file was not exported. Try again.'); setFeedback('Export prepared'); }
    } catch (failure) { if (isCurrent()) setError(failure.message || 'Export failed. Try SVG or CSV.'); }
    finally { if (isCurrent()) { running.current = false; setBusy(false); setJob(null); } }
  };
  return <>
    <IconBtn label="Export work structure" icon="download" onPress={() => { setError(''); setFeedback(''); setOpen(true); }}/>
    <Sheet visible={open} compact title="Export work structure" onClose={close} footer={<>
      <Button label={busy ? 'Cancel export' : 'Done'} variant="secondary" onPress={close}/><View style={{flex:1}}/>
      {job ? <CaptureSource scene={scene} job={job}/> : null}
    </>}>
      <T muted size={13}>Export the complete structure, including work outside the viewport.</T>
      {scene ? <View style={{gap:16}}>
        <View style={{gap:8}}><T size={12} weight="600">PNG quality</T>
          <Segmented fill options={[{ value: '2', label: '2×' }, { value: '4', label: '4×' }]} value={quality} onChange={value => { if (!busy) setQuality(value); }}/>
        </View>
        <View style={{gap:8}}><T size={12} weight="600">Background</T>
          <Segmented fill options={[{ value: 'opaque', label: 'Theme background' }, { value: 'transparent', label: 'Transparent' }]} value={background} onChange={value => { if (!busy) setBackground(value); }}/>
        </View>
        <T muted size={12}>{plan.width} × {plan.height} px{plan.limited ? ' · Sized to fit the image memory limit. SVG retains full vector detail.' : ''}</T>
      </View> : null}
      <View style={{gap:8}}><T size={12} weight="600">Format</T><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
        {scene ? <><Button label="SVG" icon="image" variant="secondary" disabled={busy} onPress={() => run('svg')}/>
          <Button label="PNG" icon="image" disabled={busy} onPress={() => run('png')}/></> : null}
        <Button label="CSV" icon="file-text" variant="secondary" disabled={busy} onPress={() => run('csv')}/>
      </View></View>
      {busy ? <T accessibilityRole="progressbar" muted>Preparing export…</T> : null}
      {error ? <T accessibilityRole="alert" color={c.danger}>{error}</T> : null}
      {feedback ? <T {...(Platform.OS === 'web' ? { role: 'status' } : { accessibilityLiveRegion: 'polite' })} color={c.success || c.accentText}>{feedback}</T> : null}
    </Sheet>
  </>;
}
