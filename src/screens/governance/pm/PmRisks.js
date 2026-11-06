// /src/screens/governance/pm/PmRisks.js
// Risk management: plan, register and probability and impact matrix.

import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Button, Card, Cell, Chip, Grid, Input, Segmented, SectionTitle, Stat, T, EmptyState, MetricStrip } from '../../../ui/ui';
import { DangerConfirm } from '../../../components/inline/CompactTools';
import MarkdownField from '../../../components/inline/MarkdownField';
const {buttonInk} = require('../../../ui/theme/themePalette.cjs');
import { useStore } from '../../../governance/store';
import { useTheme } from '../../../ui/theme/theme';
import {
  OPP_COLOR, RISK_CATEGORIES, RISK_RESPONSES, RISK_STATUS, isLive, pid, riskColor, riskLevel, riskScore,
} from '../../../governance/pm';
import { DocHeader, DocView } from './PmDocs';
import { Choice, Field, OwnerPick, Row } from './pmui';

const levelLabel = (r) => (r.type === 'Opportunity' ? 'Opportunity' : riskLevel(riskScore(r)).label);

function RiskCard({ r, open, onToggle, onChange, onDelete, draft = false, onSave, onCancel }) {
  const { c } = useTheme();
  const col = riskColor(r);
  return (
    <Card pad={0} style={{ overflow: 'hidden' }}>
      <Pressable onPress={draft ? undefined : onToggle} disabled={draft} accessibilityRole={draft ? 'header' : 'button'} accessibilityLabel={`${r.title || 'Untitled risk'}, ${levelLabel(r)}`} accessibilityState={{expanded:open}} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
        <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: col + '22', alignItems: 'center', justifyContent: 'center' }}>
          <T size={16} weight="600" color={c.ink}>{riskScore(r)}</T>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <T weight="600" numberOfLines={open ? undefined : 2}>{r.title || 'Untitled risk'}</T>
          <T size={12} muted>{r.category} · {levelLabel(r)} · {r.status}{r.owner ? ` · ${r.owner}` : ''}</T>
        </View>
      </Pressable>
      {open ? (
        <View style={{ gap: 16, padding: 14, paddingTop: 4, borderTopWidth: 1, borderColor: c.line }}>
          <Field label="Risk"><Input lazy={!draft} accessibilityLabel="Risk title" multiline value={r.title} onChangeText={(v) => onChange({ title: v })} style={{ minHeight: 56 }} /></Field>
          <Field label="Type"><Segmented options={['Threat', 'Opportunity']} value={r.type} onChange={(v) => onChange({ type: v, strategy: RISK_RESPONSES[v][2] })} /></Field>
          <Field label="Category"><Choice options={RISK_CATEGORIES} value={r.category} onChange={(v) => onChange({ category: v })} /></Field>
          <Row>
            <Field label="Probability (1 to 5)" style={{ flexGrow: 1 }}>
              <Segmented options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))} value={r.prob} onChange={(v) => onChange({ prob: v })} />
            </Field>
            <Field label="Impact (1 to 5)" style={{ flexGrow: 1 }}>
              <Segmented options={[1, 2, 3, 4, 5].map((n) => ({ value: n, label: String(n) }))} value={r.impact} onChange={(v) => onChange({ impact: v })} />
            </Field>
          </Row>
          <Field label="Response strategy"><Choice options={RISK_RESPONSES[r.type]} value={r.strategy} onChange={(v) => onChange({ strategy: v })} /></Field>
          <Field label="Response plan"><MarkdownField showLabel={false} label="Response plan" lazy={!draft} value={r.response} onChangeText={(v) => onChange({ response: v })} placeholder="What will be done, and by when" /></Field>
          <Field label="Owner"><OwnerPick value={r.owner} onChange={(v) => onChange({ owner: v })} /></Field>
          <Field label="Status"><Choice options={RISK_STATUS} value={r.status} onChange={(v) => onChange({ status: v })} /></Field>
          {draft ? (
            <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
              <Button label="Save risk" small disabled={!r.title.trim()} onPress={onSave} />
              <Button label="Cancel" small variant="ghost" onPress={onCancel} />
            </View>
          ) : <DangerConfirm label="Delete risk" onConfirm={onDelete} />}
        </View>
      ) : null}
    </Card>
  );
}

// 5 by 5 grid. Each cell counts the live risks with that probability and impact; tap one to filter the register.
function Matrix({ risks, type, picked, onPick }) {
  const { c } = useTheme();
  const cell = (p, i) => risks.filter((r) => isLive(r) && r.type === type && r.prob === p && r.impact === i);
  return (
    <View style={{ gap: 6 }}>
      {[5, 4, 3, 2, 1].map((p) => (
        <View key={p} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <T size={11} muted style={{ width: 16 }} center>{p}</T>
          {[1, 2, 3, 4, 5].map((i) => {
            const n = cell(p, i).length;
            const base = type === 'Threat' ? riskLevel(p * i).color : OPP_COLOR;
            const on = picked && picked.p === p && picked.i === i;
            return (
              <Pressable
                key={i}
                accessibilityRole="button"
                accessibilityLabel={`${type}, probability ${p}, impact ${i}, ${n} item${n === 1 ? '' : 's'}`}
                accessibilityState={{selected:!!on}}
                onPress={() => onPick(on ? null : { p, i })}
                style={{ flex: 1, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: base, opacity: n ? 1 : 0.3, borderWidth: on ? 3 : 0, borderColor: c.ink }}
              >
                {n ? <T size={15} weight="600" color={buttonInk(base)}>{n}</T> : null}
              </Pressable>
            );
          })}
        </View>
      ))}
      <View style={{ flexDirection: 'row', gap: 6, paddingLeft: 22 }}>
        {[1, 2, 3, 4, 5].map((i) => <T key={i} size={11} muted center style={{ flex: 1 }}>{i}</T>)}
      </View>
      <T size={11} muted center>Impact across, probability up</T>
    </View>
  );
}

export default function PmRisks() {
  const { s, setPm } = useStore();
  const risks = s.pm.risks;
  const [tab, setTab] = useState('register');
  const [filter, setFilter] = useState('Live');
  const [type, setType] = useState('Threat');
  const [picked, setPicked] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [draftRisk, setDraftRisk] = useState(null);

  const save = (next, label) => setPm('risks', next, label);
  const live = risks.filter(isLive);
  const threats = live.filter((r) => r.type === 'Threat');
  const high = threats.filter((r) => riskScore(r) >= 10);
  const opps = live.filter((r) => r.type === 'Opportunity');

  const add = () => {
    const r = { id: pid('rk'), title: '', category: 'Technical', type: 'Threat', prob: 3, impact: 3, strategy: 'Mitigate', response: '', owner: '', status: 'Open' };
    setDraftRisk(r); // Nothing is persisted until Save risk.
    setTab('register');
    setFilter('All');
  };

  let shown = risks.filter((r) => (filter === 'All' ? true : filter === 'Live' ? isLive(r) : filter === 'High and critical' ? isLive(r) && r.type === 'Threat' && riskScore(r) >= 10 : r.status === filter));
  if (tab === 'matrix') shown = risks.filter((r) => isLive(r) && r.type === type && (!picked || (r.prob === picked.p && r.impact === picked.i)));
  shown = [...shown].sort((a, b) => riskScore(b) - riskScore(a));

  return (
    <View style={{ gap: 14 }}>
      <DocHeader docKey="risks" />
      <MetricStrip items={[{label:'Live threats',value:threats.length},{label:'High & critical',value:high.length},{label:'Opportunities',value:opps.length},{label:'Closed',value:risks.length-live.length}]}/>

      <Segmented fill options={[{ value: 'register', label: 'Register' }, { value: 'matrix', label: 'Matrix' }, { value: 'plan', label: 'Plan' }]} value={tab} onChange={setTab} />

      {tab === 'plan' ? <PlanOnly /> : null}

      {tab === 'matrix' ? (
        <Card style={{ gap: 14 }}>
          <SectionTitle right={<Segmented options={['Threat', 'Opportunity']} value={type} onChange={(v) => { setType(v); setPicked(null); }} />}>Probability and impact</SectionTitle>
          <Matrix risks={risks} type={type} picked={picked} onPick={setPicked} />
          <T size={12} muted>{picked ? `Showing probability ${picked.p}, impact ${picked.i}. Tap the cell again to clear.` : 'Counts are live risks. Tap a cell to list them.'}</T>
        </Card>
      ) : null}

      {tab === 'register' ? (
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {['Live', 'High and critical', 'All', 'Closed'].map((f) => <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />)}
          <View style={{ flex: 1 }} />
          <Button label="Add risk" icon="plus" small onPress={add} disabled={!!draftRisk} />
        </View>
      ) : null}

      {tab !== 'plan' ? (
        <View style={{ gap: 10 }}>
          {draftRisk && tab === 'register' ? <RiskCard key={draftRisk.id} draft r={draftRisk} open onToggle={() => {}}
            onChange={(patch) => setDraftRisk(prev => prev ? {...prev, ...patch} : prev)}
            onSave={() => { if (!draftRisk.title.trim()) return; save([draftRisk, ...risks], 'Added a risk'); setOpenId(draftRisk.id); setDraftRisk(null); }}
            onCancel={() => setDraftRisk(null)} /> : null}
          {shown.length === 0 && !draftRisk ? <EmptyState kind="work" title={risks.length?"No matching risks":"Make uncertainty visible"} description="Record a threat or opportunity, assess its impact and assign a response." action={<Button label="Add risk" icon="plus" onPress={add}/>}/> : null}
          {shown.map((r) => (
            <RiskCard
              key={r.id}
              r={r}
              open={openId === r.id}
              onToggle={() => setOpenId(openId === r.id ? null : r.id)}
              onChange={(patch) => save(risks.map((x) => (x.id === r.id ? { ...x, ...patch } : x)))}
              onDelete={() => { save(risks.filter((x) => x.id !== r.id), 'Deleted a risk'); setOpenId(null); }}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

// The plan tab shows only the template sections; the header above already covers status.
function PlanOnly() {
  return <DocView docKey="risks" bare />;
}
