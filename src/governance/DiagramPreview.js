// /src/governance/DiagramPreview.js
import { useCallback, useMemo, useRef, useState } from 'react';
import { Modal, ScrollView, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActionMenu, IconBtn, Segmented, Sheet, T } from '../ui/ui';
import { useTheme } from '../ui/theme/theme';
import { useBackDismiss } from '../app/navigation/useBackNavigation';
import BackSurface from '../app/navigation/BackSurface';
import Reveal from '../ui/Reveal';
import DiagramViewport from '../gestures/DiagramViewport';
import { Scene } from './wbsviews';
import DiagramExports from './DiagramExports';
const { fitScale, constrainPose, pinchPose } = require('../gestures/diagramZoom.cjs');

export default function DiagramPreview({ scene, name, kind, nodes, rows, getCSV, direction, onDirectionChange, onClose }) {
  const { c } = useTheme(), size = useWindowDimensions(), insets = useSafeAreaInsets();
  const [zoom, setZoom] = useState('fit'), [request, setRequest] = useState(0), [initialPose, setInitialPose] = useState(null), [selected, setSelected] = useState(null);
  const [measured, setMeasured] = useState(null);
  const lastPose = useRef(null);
  useBackDismiss(true, onClose, 20);
  const height = measured?.height || Math.max(200, size.height - insets.top - insets.bottom - 80);
  const width = measured?.width || size.width - insets.left - insets.right;
  const bounds = { width, height, contentWidth: scene.width, contentHeight: scene.height, minScale: Math.max(0.00001, Math.min(0.25, (width - 4) / scene.width, height / scene.height)), center: true, fullScreen: true };
  const current = () => lastPose.current || constrainPose({ scale: zoom === 'fit' ? fitScale(bounds) : Number(zoom), x: 0, y: 0 }, bounds);
  const preset = value => { lastPose.current = null; setInitialPose(null); setZoom(value); setRequest(n => n + 1); };
  const command = (factor, dx = 0, dy = 0) => {
    const center = { x: width / 2, y: height / 2 }, old = current();
    const next = factor === 1 ? constrainPose({ ...old, x: old.x + dx, y: old.y + dy }, bounds) : pinchPose(old, factor, center, center, bounds);
    lastPose.current = next; setInitialPose(next); setZoom(String(next.scale)); setRequest(n => n + 1);
  };
  const select = useCallback(id => setSelected(id), []);
  const diagram = useMemo(() => <Scene scene={scene} onSelect={select}/>, [scene, select]);
  const raw = nodes.find(n => n.id === selected), row = rows.find(n => n.id === selected);
  const title = kind === 'tree' ? 'Tree' : kind === 'fishbone' ? 'Fishbone' : 'Mind map';
  return <Modal visible animationType="fade" presentationStyle="fullScreen" onRequestClose={onClose} hardwareAccelerated>
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: c.bg }}>
      <SafeAreaProvider><BackSurface style={{ flex: 1, backgroundColor: c.bg }}><SafeAreaView edges={['top','bottom','left','right']} style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
          <View style={{ flex: 1, gap: 4, minWidth: 0 }}><T size={17} weight="600" numberOfLines={1}>{title}</T><T muted size={12} numberOfLines={1}>{name} · {Math.max(0, rows.length - 1)} work elements</T></View>
          <ActionMenu label="Navigate diagram" icon="move" items={[
            { label: 'Pan left', icon: 'arrow-left', onPress: () => command(1, 120, 0) },
            { label: 'Pan right', icon: 'arrow-right', onPress: () => command(1, -120, 0) },
            { label: 'Pan up', icon: 'arrow-up', onPress: () => command(1, 0, 120) },
            { label: 'Pan down', icon: 'arrow-down', onPress: () => command(1, 0, -120) },
          ]}/>
          <DiagramExports scene={scene} name={name} kind={kind} getCSV={getCSV}/>
          <IconBtn icon="x" label="Close diagram preview" onPress={onClose}/>
        </View>
        {kind === 'tree' && onDirectionChange ? <ScrollView horizontal style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <Segmented options={[{ value: 'down', label: 'Top-down' }, { value: 'right', label: 'Left to right' }]} value={direction}
            onChange={value => { if (value !== direction) { preset('fit'); setSelected(null); onDirectionChange(value); } }}/>
        </ScrollView> : null}
        <View style={{ flex: 1, overflow: 'hidden' }} onLayout={event => {
          const {width, height} = event.nativeEvent.layout;
          if(width > 0 && height > 0 && (width !== measured?.width || height !== measured?.height)) setMeasured({width, height});
        }}>
          <DiagramViewport scene={scene} scale={zoom === 'fit' ? 'fit' : Number(zoom)} fullScreen viewportHeight={height}
            initialPose={lastPose.current || initialPose} resetKey={`preview:${kind}:${direction || ''}:${request}`} onZoom={value => setZoom(String(value))} onPose={value => { lastPose.current = value; }}>
            {diagram}
          </DiagramViewport>
          <Reveal distance={4} duration={150} style={{ position: 'absolute', bottom: 16, alignSelf: 'center', maxWidth: '96%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 20, padding: 4 }}>
              <IconBtn label="Fit diagram to screen" icon="maximize" onPress={() => preset('fit')}/>
              <IconBtn label="Reset diagram zoom" icon="rotate-ccw" onPress={() => preset('1')}/>
              <IconBtn label="Zoom out diagram" icon="minus" onPress={() => command(0.8)}/>
              <T size={12} weight="600" style={{ minWidth: 44, textAlign: 'center' }}>{zoom === 'fit' ? 'Fit' : `${Math.round(Number(zoom) * 100)}%`}</T>
              <IconBtn label="Zoom in diagram" icon="plus" onPress={() => command(1.25)}/>
            </View>
          </Reveal>
        </View>
        <Sheet visible={!!raw} compact title={row?.name || raw?.name || name} onClose={() => setSelected(null)}>
          <T muted size={12}>{row?.code || 'Project'} · Work element</T>
          <T size={14}>Owner: {raw?.owner || 'Unassigned'}</T>
          <T size={14}>Estimated hours: {row?.hours || 0}</T>
          <T size={14}>{raw?.note || 'No description yet. Edit this work element in Outline.'}</T>
        </Sheet>
      </SafeAreaView></BackSurface></SafeAreaProvider>
    </GestureHandlerRootView>
  </Modal>;
}
