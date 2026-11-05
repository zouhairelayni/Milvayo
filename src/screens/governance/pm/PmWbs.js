// /src/screens/governance/pm/PmWbs.js
// Work breakdown structure: build it as an outline, then see it as a tree, fishbone or mind map.

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Button, Card, Input, Segmented, SectionTitle, T, downloadText, useWide } from '../../../ui/ui';
import { useStore } from '../../../governance/store';
import { useTheme } from '../../../ui/theme/theme';
import {
  PHASES, WBS_ROOT, buildTree, canIndent, canOutdent, flattenTree, pid, wbsAddChild, wbsAddSibling, wbsCSV, wbsDelete,
  wbsIndent, wbsMove, wbsOutdent, wbsUpdate,
} from '../../../governance/pm';
import { BRANCH, Scene, sceneFor, sceneToSvg } from '../../../governance/wbsviews';
import { DocHeader } from './PmDocs';
import { Field, NumInput, OwnerPick } from './pmui';
import MarkdownField from '../../../components/inline/MarkdownField';
import DiagramViewport from '../../../gestures/DiagramViewport';

const slug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';

const TEMPLATES = {
  deliverables: ['Project management', 'Design', 'Build', 'Test', 'Launch'],
  phases: PHASES,
};

function OutlineRow({ n, open, onOpen, nodes, save, select }) {
  const { c } = useTheme();
  const root = n.level === 0;
  const col = root ? c.ink : BRANCH[n.branch % BRANCH.length];
  const raw = nodes.find((x) => x.id === n.id);
  const change = (patch) => save(wbsUpdate(nodes, n.id, patch));
  const add = (res) => { save(res.nodes); if (res.id) select(res.id); };
  return (
    <View style={{ marginLeft: Math.min(n.level, 5) * 14 }}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${n.code || 'Project'}: ${n.name}`}
        accessibilityState={{expanded:open}}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, backgroundColor: open ? c.surfaceAlt : 'transparent', opacity: pressed ? 0.7 : 1 })}
      >
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: col }} />
        <T size={12} weight="700" muted style={{ width: 44 }}>{n.code || 'Project'}</T>
        <T weight={n.level <= 1 ? '700' : '500'} style={{ flex: 1 }} numberOfLines={open ? undefined : 1}>{n.name}</T>
        {n.hours ? <T size={12} muted>{n.hours}h</T> : null}
      </Pressable>

      {open ? (
        <Card style={{ gap: 14, marginBottom: 6, marginTop: 4 }}>
          {!root ? (
            <>
              <Field label="Name"><Input lazy value={raw.name} onChangeText={(v) => change({ name: v })} /></Field>
              <Field label="Owner"><OwnerPick value={raw.owner} onChange={(v) => change({ owner: v })} /></Field>
              {n.children.length === 0 ? (
                <Field label="Estimated hours"><NumInput value={raw.hours} onChange={(v) => change({ hours: v })} /></Field>
              ) : (
                <T size={12} muted>{n.hours}h rolled up from {n.children.length} element{n.children.length === 1 ? '' : 's'} below.</T>
              )}
              <Field label="Description (WBS dictionary)">
                <MarkdownField showLabel={false} label="WBS description" lazy value={raw.note || ''} onChangeText={(v) => change({ note: v })} placeholder="What this work package delivers and how it is accepted" />
              </Field>
            </>
          ) : (
            <T size={12} muted>The project is the top of the structure. Add the main deliverables or phases beneath it.</T>
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Button label="Add below" icon="corner-down-right" small variant="secondary" onPress={() => add(wbsAddChild(nodes, n.id))} />
            {!root ? <Button label="Add next" icon="plus" small variant="secondary" onPress={() => add(wbsAddSibling(nodes, n.id))} /> : null}
            {!root ? <Button label="Up" icon="arrow-up" small variant="ghost" onPress={() => save(wbsMove(nodes, n.id, -1))} /> : null}
            {!root ? <Button label="Down" icon="arrow-down" small variant="ghost" onPress={() => save(wbsMove(nodes, n.id, 1))} /> : null}
            {!root ? <Button label="Indent" icon="arrow-right" small variant="ghost" disabled={!canIndent(nodes, n.id)} onPress={() => save(wbsIndent(nodes, n.id))} /> : null}
            {!root ? <Button label="Outdent" icon="arrow-left" small variant="ghost" disabled={!canOutdent(nodes, n.id)} onPress={() => save(wbsOutdent(nodes, n.id))} /> : null}
            {!root ? <Button label="Delete" icon="trash-2" small variant="danger" onPress={() => { save(wbsDelete(nodes, n.id)); select(null); }} /> : null}
          </View>
        </Card>
      ) : null}
    </View>
  );
}

export default function PmWbs() {
  const { c } = useTheme();
  const wide = useWide();
  const { s, setPm } = useStore();
  const nodes = s.pm.wbs;
  const tree = useMemo(() => buildTree(nodes, s.project.name), [nodes, s.project.name]);
  const rows = useMemo(() => flattenTree(tree), [tree]);
  const [view, setView] = useState('outline');
  const [dir, setDir] = useState('down');
  const [zoom, setZoom] = useState('1');
  const [zoomRequest, setZoomRequest] = useState(0);
  const [sel, setSel] = useState(null);

  const save = (next) => setPm('wbs', next);
  const leaves = rows.filter((n) => n.level > 0 && n.children.length === 0).length;
  const depth = Math.max(0, ...rows.map((n) => n.level));
  const empty = nodes.length <= 1;

  const seedFrom = (names) => {
    const kids = names.map((name) => ({ id: pid('w'), parent: WBS_ROOT, name, owner: '', hours: 0, note: '' }));
    setPm('wbs', [...nodes, ...kids], 'Started the WBS from a template');
  };

  const scene = useMemo(() => (view === 'outline' ? null : sceneFor(view, tree, dir)), [view, tree, dir]);
  const diagram = useMemo(() => scene ? <Scene scene={scene} /> : null, [scene]);
  const scale = zoom === 'fit' ? 'fit' : Number(zoom);
  const chooseZoom = value => { setZoom(value); setZoomRequest(n => n + 1); };

  return (
    <View style={{ gap: 14 }}>
      <DocHeader docKey="wbs" />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {[['Elements', rows.length - 1], ['Work packages', leaves], ['Levels', depth], ['Estimated hours', tree.hours]].map(([label, value]) => (
          <Card key={label} pad={12} accessibilityLabel={`${label}, ${value}`} style={{ flexBasis: wide ? '23%' : '47%', flexGrow: 1, minWidth: 0, height: 88, gap: 4, justifyContent: 'space-between' }}>
            <T size={12} muted numberOfLines={2} style={{ lineHeight: 16 }}>{label}</T>
            <T size={24} weight="600" numberOfLines={1} style={{ lineHeight: 28, fontVariant: ['tabular-nums'] }}>{value}</T>
          </Card>
        ))}
      </View>

      <Segmented fill options={[{ value: 'outline', label: 'Outline' }, { value: 'tree', label: 'Tree' }, { value: 'fishbone', label: 'Fishbone' }, { value: 'mind', label: 'Mind map' }]} value={view} onChange={setView} />

      {empty ? (
        <Card style={{ gap: 12 }}>
          <SectionTitle>Start the structure</SectionTitle>
          <T size={13} muted>Begin from a template, or add your first element and build down from there.</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Button label="Deliverable-based" small onPress={() => seedFrom(TEMPLATES.deliverables)} />
            <Button label="Phase-based (PMI process groups)" small variant="secondary" onPress={() => seedFrom(TEMPLATES.phases)} />
            <Button label="Add first element" icon="plus" small variant="secondary" onPress={() => { const r = wbsAddChild(nodes, WBS_ROOT); save(r.nodes); setSel(r.id); }} />
          </View>
        </Card>
      ) : null}

      {view === 'outline' && !empty ? (
        <Card style={{ gap: 4 }}>
          {rows.map((n) => (
            <OutlineRow key={n.id} n={n} open={sel === n.id} onOpen={() => setSel(sel === n.id ? null : n.id)} nodes={nodes} save={save} select={setSel} />
          ))}
        </Card>
      ) : null}

      {scene && !empty ? (
        <Card style={{ gap: 12 }} pad={14}>
          <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            {view === 'tree' ? <View style={{ flexShrink: 0 }}><Segmented options={[{ value: 'down', label: 'Top-down' }, { value: 'right', label: 'Left to right' }]} value={dir} onChange={setDir} /></View> : null}
            <View style={{ flexShrink: 0 }}><Segmented options={[{ value: 'fit', label: 'Fit' }, { value: '1', label: '100%' }, { value: '1.5', label: '150%' }]} value={zoom} onChange={chooseZoom} /></View>
          </ScrollView>
          <View style={{ width: '100%' }}>
            <DiagramViewport scene={scene} scale={scale} resetKey={`${view}:${dir}:${zoomRequest}`} onZoom={value => setZoom(String(value))}>
              {diagram}
            </DiagramViewport>
          </View>
          <T size={12} muted>Pinch to zoom, drag to pan. Read only. Edit the structure in Outline.</T>
        </Card>
      ) : null}

      {!empty ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {view !== 'outline' && scene ? (
            <Button
              label="Export diagram (SVG)"
              icon="image"
              small
              variant="secondary"
              onPress={() => downloadText(`${slug(s.project.name)}-wbs-${view}.svg`, sceneToSvg(scene, c), 'image/svg+xml')}
            />
          ) : null}
          <Button label="Export WBS (CSV)" icon="download" small variant="secondary" onPress={() => downloadText(`${slug(s.project.name)}-wbs.csv`, wbsCSV(tree), 'text/csv')} />
        </View>
      ) : null}
    </View>
  );
}
