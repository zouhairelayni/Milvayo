// /src/screens/governance/pm/PmWbs.js
// Work breakdown structure: build it as an outline, then see it as a tree, fishbone or mind map.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { ActionRow, EmptyState, MetricStrip, IconBtn, Button, Card, Input, Segmented, T, useWide } from '../../../ui/ui';
import { useStore } from '../../../governance/store';
import { useTheme } from '../../../ui/theme/theme';
import {
  PHASES, WBS_ROOT, buildTree, canIndent, canOutdent, flattenTree, pid, wbsAddChild, wbsAddSibling, wbsCSV, wbsDelete,
  wbsIndent, wbsMove, wbsOutdent, wbsUpdate,
} from '../../../governance/pm';
import { BRANCH, Scene, sceneFor } from '../../../governance/wbsviews';
import { DocHeader } from './PmDocs';
import { Field, NumInput, OwnerPick } from './pmui';
import MarkdownField from '../../../components/inline/MarkdownField';
import DiagramViewport from '../../../gestures/DiagramViewport';

import DiagramKindIcon from '../../../governance/DiagramKindIcon';
import DiagramPreview from '../../../governance/DiagramPreview';
import DiagramExports from '../../../governance/DiagramExports';
import { diagnosticMonitor } from '../../../diagnostics/monitor';
import { useRenderMetric } from '../../../diagnostics/useRenderMetric';
const { diagramCache, diagramRevision, diagramView } = require('../../../governance/diagramCache.cjs');

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
          <ActionRow primary={<Button label="Add below" icon="corner-down-right" small onPress={() => add(wbsAddChild(nodes, n.id))} />}
            menuLabel="Arrange work element" items={root ? [] : [
              {label:'Add next',icon:'plus',onPress:()=>add(wbsAddSibling(nodes,n.id))},
              {label:'Move up',icon:'arrow-up',onPress:()=>save(wbsMove(nodes,n.id,-1))},
              {label:'Move down',icon:'arrow-down',onPress:()=>save(wbsMove(nodes,n.id,1))},
              {label:'Indent',icon:'arrow-right',disabled:!canIndent(nodes,n.id),onPress:()=>save(wbsIndent(nodes,n.id))},
              {label:'Outdent',icon:'arrow-left',disabled:!canOutdent(nodes,n.id),onPress:()=>save(wbsOutdent(nodes,n.id))},
              {label:'Delete element',icon:'trash-2',danger:true,confirmation:{title:'Delete work element?',description:`Remove “${n.name}” and its nested work elements? This changes the outline only, not project tasks.`,confirmLabel:'Delete element'},onPress:()=>{const ok=save(wbsDelete(nodes,n.id));if(ok!==false)select(null);return ok;}},
            ]}/>

        </Card>
      ) : null}
    </View>
  );
}

export default function PmWbs() {
  const { c } = useTheme();
  const wide = useWide();
  useRenderMetric('projects/wbs');
  const { s, setPm, currentId, workspaceId } = useStore();
  const scope = JSON.stringify([workspaceId || 'local', currentId || 'project']);
  const remembered = useMemo(() => diagramView(scope), [scope]);
  const nodes = s.pm.wbs;
  const revision = useMemo(() => diagramRevision(nodes, s.project.name), [nodes, s.project.name]);
  const {tree, rows} = useMemo(() => diagramCache.get([scope, 'hierarchy', revision.full], () => {
    const tree = buildTree(nodes.map(n => ({id:n.id,parent:n.parent,name:n.name,hours:n.hours})), s.project.name);
    return {tree, rows: flattenTree(tree)};
  }, value => value.rows.length * 768).value, [scope, revision.full]);
  const [view, updateView] = useState(remembered.view);
  const [dir, updateDir] = useState(remembered.dir);
  const [zoom, updateZoom] = useState(remembered.zoom);
  const setView = value => { remembered.view = value; if(value!=='outline')remembered.diagramKind=value; updateView(value); const next=remembered.zooms[`${value}:${dir}`]||'1';remembered.zoom=next;updateZoom(next); };
  const setDir = value => { remembered.dir = value; updateDir(value); const next=remembered.zooms[`${view}:${value}`]||'1';remembered.zoom=next;updateZoom(next); };
  const setZoom = value => { remembered.zoom = value; remembered.zooms[`${view}:${dir}`]=value; updateZoom(value); };
  const [expanded, setExpanded] = useState(false);
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

  const sceneRevision = view === 'tree' && dir === 'down' ? revision.full : revision.structure;
  const {scene, sceneError} = useMemo(() => {
    if(view === 'outline' || empty) return {scene:null,sceneError:''};
    try {
      const entry = diagnosticMonitor.measureWork(`diagram/${view}/lookup`, () => diagramCache.get([scope, view, sceneRevision, view === 'tree' ? dir : ''],
        () => diagnosticMonitor.measureWork(`diagram/${view}/layout`, () => sceneFor(view, tree, dir)),
        value => value.items.length * 1024 + JSON.stringify(value).length * 2));
      const stats = diagramCache.stats();
      diagnosticMonitor.recordAction(`diagram ${view}: ${entry.hit?'cache hit':'calculated'}; ${entry.value.items.length} primitives; ${entry.ms.toFixed(1)}ms; cache ${stats.entries} entries/${stats.estimatedBytes} estimated bytes`);
      return {scene:entry.value,sceneError:''};
    } catch(error) { return {scene:null,sceneError:error.message || 'Could not lay out this diagram. Try Outline.'}; }
  }, [scope, view, dir, sceneRevision, empty]);
  useEffect(() => { if (!scene) setExpanded(false); }, [scene]);
  const diagram = useMemo(() => scene ? <Scene scene={scene} /> : null, [scene]);
  const scale = zoom === 'fit' ? 'fit' : Number(zoom);
  const poseKey = `${view}:${dir}`;
  const storedPose = remembered.poses[poseKey];
  const initialPose = storedPose?.revision === sceneRevision ? storedPose.pose : null;
  const chooseZoom = value => { delete remembered.poses[poseKey]; setZoom(value); setZoomRequest(n => n + 1); };
  const getCSV = useCallback(() => wbsCSV(buildTree(nodes, s.project.name)), [nodes, s.project.name]);

  return (
    <View style={{ gap: 14 }}>
      <DocHeader docKey="wbs" />

      <MetricStrip items={[{label:'Elements',value:rows.length-1},{label:'Work packages',value:leaves},{label:'Levels',value:depth},{label:'Estimated hours',value:tree.hours}]}/>

      <Segmented fill options={[{ value: 'outline', label: 'Outline' }, { value: 'diagram', label: 'Diagram' }]} value={view === 'outline' ? 'outline' : 'diagram'} onChange={value => setView(value === 'outline' ? 'outline' : remembered.diagramKind || 'tree')} />
      {view !== 'outline' ? <Segmented options={[{value:'tree',label:'Tree'},{value:'fishbone',label:'Fishbone'},{value:'mind',label:'Mind map'}].map(option=>({...option,icon:<DiagramKindIcon kind={option.value} color={view===option.value?c.bg:c.muted}/>}))} value={view} onChange={setView}/> : null}

      {empty ? (
        <EmptyState title="Give the work a structure" description="Start with one deliverable, then break it into smaller work packages."
          action={<ActionRow primary={<Button label="Add first element" icon="plus" onPress={()=>{const r=wbsAddChild(nodes,WBS_ROOT);save(r.nodes);setSel(r.id);}}/>}
            menuLabel="Start from a template" items={[{label:'Deliverable-based',icon:'layers',onPress:()=>seedFrom(TEMPLATES.deliverables)},{label:'PMI process groups',icon:'list',onPress:()=>seedFrom(TEMPLATES.phases)}]}/>}/>
      ) : null}

      {view === 'outline' && !empty ? (
        <Card style={{ gap: 4 }}>
          {rows.map((n) => (
            <OutlineRow key={n.id} n={n} open={sel === n.id} onOpen={() => setSel(sel === n.id ? null : n.id)} nodes={nodes} save={save} select={setSel} />
          ))}
        </Card>
      ) : null}

      {sceneError ? <Card><T accessibilityRole="alert" color={c.danger}>{sceneError}</T><T muted size={12}>Your structure is unchanged. Return to Outline to inspect it.</T></Card> : null}
      {scene && !empty ? (
        <Card style={{ gap: 12 }} pad={14}>
          <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            {view === 'tree' ? <View style={{ flexShrink: 0 }}><Segmented options={[{ value: 'down', label: 'Top-down' }, { value: 'right', label: 'Left to right' }]} value={dir} onChange={setDir} /></View> : null}
            <View style={{ flexShrink: 0 }}><Segmented options={[{ value: 'fit', label: 'Fit' }, { value: '1', label: '100%' }, { value: '1.5', label: '150%' }]} value={zoom} onChange={chooseZoom} /></View>
          </ScrollView>
          <View style={{alignItems:'flex-end'}}><IconBtn label="Expand diagram" icon="maximize-2" onPress={()=>setExpanded(true)}/></View>
          <View style={{ width: '100%' }}>
            {expanded ? <View style={{height:Math.min(440,scene.height)}}/> : <DiagramViewport scene={scene} scale={scale} initialPose={initialPose} fitAll resetKey={`${view}:${dir}:${zoomRequest}`} onZoom={value => setZoom(String(value))} onPose={pose=>{remembered.poses[poseKey]={revision:sceneRevision,pose};}}>
              {diagram}
            </DiagramViewport>}
          </View>
          <T size={12} muted>Pinch to zoom, drag to pan. Read only. Edit the structure in Outline.</T>
        </Card>
      ) : null}

      {!empty ? <View style={{alignItems:'flex-end'}}><DiagramExports scene={scene} name={s.project.name} kind={view} getCSV={getCSV}/></View> : null}
      {expanded && scene ? <DiagramPreview scene={scene} name={s.project.name} kind={view} direction={dir} onDirectionChange={setDir} nodes={nodes} rows={rows} getCSV={getCSV} onClose={()=>setExpanded(false)}/> : null}
    </View>
  );
}
