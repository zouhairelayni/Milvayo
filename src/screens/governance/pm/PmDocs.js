// /src/screens/governance/pm/PmDocs.js
// Document views for a project: the generic PMI template editor, the stakeholder grid and the budget.

import { useState } from 'react';
import { View } from 'react-native';
import { Bar, Button, Card, Cell, Grid, Input, Pill, SectionTitle, Segmented, Stat, T, MetricStrip, FormSection, Feedback } from '../../../ui/ui';
import { useStore } from '../../../governance/store';
import { useTheme, PRIORITY_COLOR, STATUS_COLOR } from '../../../ui/theme/theme';
import { money } from '../../../governance/data';
import { DOC_BY_KEY, DOC_COLOR, DOC_STATUS, budgetOf, docOf, docProgress, financeOf } from '../../../governance/pm';
import { Field, ListEditor, MiniBtn, NumInput, Row, TableEditor } from './pmui';
import {Dropdown} from '../../../components/inline/CompactTools';
import MarkdownField from '../../../components/inline/MarkdownField';

// Title, what the document is for, its status and how much of the template has content.
export function DocHeader({ docKey }) {
  const { s, setDocStatus } = useStore();
  const def = DOC_BY_KEY[docKey];
  const doc = docOf(s.pm, docKey);
  const pct = docProgress(s.pm, docKey);
  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 6 }}>
        <T size={24} weight="600" accessibilityRole="header">{def.title}</T>
        <T size={13} muted>{def.blurb}</T>
      </View>
      <Field label="Status">
        <Segmented fill options={DOC_STATUS} value={doc.status} onChange={(v) => setDocStatus(docKey, v, def.title)} />
      </Field>
      <View style={{ gap: 6 }}>
        <Bar value={pct} height={6} color={DOC_COLOR[doc.status]} />
        <T size={12} muted>{Math.round(pct * 100)}% of the template filled in</T>
      </View>
    </View>
  );
}

const Mini = ({ label, value, color }) => (
  <View style={{ minWidth: 110, gap: 2 }}>
    <T size={11} weight="600" muted>{label}</T>
    <T size={20} weight="600" color={color} style={{ letterSpacing: -0.5 }}>{value}</T>
  </View>
);

// Cost-benefit inputs with the three numbers a sponsor asks for: NPV, ROI and payback.
function Finance({ value = {}, onChange }) {
  const { c } = useTheme();
  const f = financeOf(value);
  const set = (k, v) => onChange({ ...value, [k]: v });
  return (
    <View style={{ gap: 16 }}>
      <Row>
        {[['cost', 'Total cost ($)'], ['annualBenefit', 'Benefit per year ($)'], ['years', 'Years counted'], ['rate', 'Discount rate (%)']].map(([k, l]) => (
          <View key={k} style={{ flexBasis: 140, flexGrow: 1 }}>
            <Field label={l}><NumInput value={value[k]} onChange={(v) => set(k, v)} /></Field>
          </View>
        ))}
      </Row>
      <Row gap={20}>
        <Mini label="Net present value" value={money(f.npv)} color={f.npv < 0 ? c.accent : STATUS_COLOR.Done} />
        <Mini label="ROI" value={`${Math.round(f.roi * 100)}%`} />
        <Mini label="Payback" value={f.payback == null ? 'n/a' : `${f.payback.toFixed(1)} yrs`} />
        <Mini label="Total benefit" value={money(f.total)} />
      </Row>
    </View>
  );
}

// Power and interest grid built from the register. Medium and High both count as the upper half.
function StakeholderGrid({ rows }) {
  const { c } = useTheme();
  const up = (v) => v === 'High' || v === 'Medium';
  const cells = [
    ['Keep satisfied', 'High influence, lower interest', (r) => up(r.influence) && !up(r.interest)],
    ['Manage closely', 'High influence, high interest', (r) => up(r.influence) && up(r.interest)],
    ['Monitor', 'Lower influence, lower interest', (r) => !up(r.influence) && !up(r.interest)],
    ['Keep informed', 'Lower influence, high interest', (r) => !up(r.influence) && up(r.interest)],
  ];
  return (
    <Card style={{ gap: 12 }}>
      <SectionTitle>Power and interest grid</SectionTitle>
      <Grid gap={8}>
        {cells.map(([title, sub, test]) => {
          const people = (rows || []).filter(test);
          return (
            <View key={title} style={{ flexBasis: '48%', flexGrow: 1, minHeight: 96, gap: 6, padding: 12, borderRadius: 12, backgroundColor: c.surfaceAlt }}>
              <T size={13} weight="700">{title}</T>
              <T size={11} muted>{sub}</T>
              {people.length ? people.map((r) => <T key={r.id} size={12}>{r.name || 'Unnamed'}{r.role ? ` · ${r.role}` : ''}</T>) : <T size={12} muted>Nobody yet</T>}
            </View>
          );
        })}
      </Grid>
    </Card>
  );
}

// Any template made of text, list, table, finance and derived sections.
export function DocView({ docKey, bare }) {
  const { s, setDocValue } = useStore();
  const def = DOC_BY_KEY[docKey];
  const vals = docOf(s.pm, docKey).values;
  const [section,setSection]=useState(null);
  const current=def.sections.some(x=>x.key===section)?section:def.sections[0]?.key;
  return (
    <View style={{ gap: 14 }}>
      {bare ? null : <DocHeader docKey={docKey} />}
      <Dropdown title="Document section" options={def.sections.map(sec=>({value:sec.key,label:sec.label}))} value={current} onChange={setSection}/>
      {def.sections.map((sec) => (
        <View key={sec.key} style={{display:current===sec.key?'flex':'none',gap:16}}>
          <SectionTitle>{sec.label}</SectionTitle>
          {sec.hint ? <T size={12} muted style={{ marginTop: -6 }}>{sec.hint}</T> : null}
          {sec.kind === 'text' ? <MarkdownField showLabel={false} label={sec.label} lazy value={vals[sec.key] || ''} onChangeText={(t) => setDocValue(docKey, sec.key, t)} placeholder="Write here" /> : null}
          {sec.kind === 'list' ? <ListEditor items={vals[sec.key]} onChange={(v) => setDocValue(docKey, sec.key, v)} /> : null}
          {sec.kind === 'table' ? <TableEditor cols={sec.cols} rows={vals[sec.key]} onChange={(v) => setDocValue(docKey, sec.key, v)} /> : null}
          {sec.kind === 'finance' ? <Finance value={vals[sec.key]} onChange={(v) => setDocValue(docKey, sec.key, v)} /> : null}
          {sec.kind === 'derived' ? <T size={14}>{sec.get(s)}</T> : null}
        </View>
      ))}
      {def.extra === 'grid' ? <StakeholderGrid rows={vals.register} /> : null}
    </View>
  );
}

// ---- Budget -------------------------------------------------------------------------------------

export function BudgetView() {
  const { c } = useTheme();
  const { s, setPm, updateProject } = useStore();
  const b = budgetOf(s);
  const lines = s.pm.budget.lines;
  const setBudget = (patch) => setPm('budget', { ...s.pm.budget, ...patch });
  const setLine = (id, patch) => setBudget({ lines: lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  const over = b.baseline > b.approved;
  const denom = Math.max(1, b.approved);

  return (
    <View style={{ gap: 14 }}>
      <DocHeader docKey="budget" />

      <Card style={{ gap: 14 }}>
        <SectionTitle>Approved budget</SectionTitle>
        <Row>
          <View style={{ flexBasis: 160, flexGrow: 1 }}>
            <Field label="Approved ($)"><NumInput value={s.project.budget} onChange={(v) => updateProject({ budget: v })} /></Field>
          </View>
          <View style={{ flexBasis: 160, flexGrow: 1 }}>
            <Field label="Contingency reserve (%)" hint="Added on top of planned cost."><NumInput value={s.pm.budget.contingencyPct} onChange={(v) => setBudget({ contingencyPct: v })} /></Field>
          </View>
        </Row>
      </Card>

      <MetricStrip items={[{label:'Planned cost',value:money(b.planned)},{label:'Contingency',value:money(b.contingency)},
        {label:'Cost baseline',value:money(b.baseline)},{label:over?'Over budget':'Unallocated',value:money(Math.abs(b.unallocated)),color:over?c.danger:c.success}]}/>

      <Card style={{ gap: 14 }}>
        <SectionTitle>Against the approved budget</SectionTitle>
        {[['Baseline', b.baseline, STATUS_COLOR['In progress']], ['Committed', b.committed, '#D89614'], ['Spent', b.actual, STATUS_COLOR.Done]].map(([l, v, col]) => (
          <View key={l} style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <T size={13}>{l}</T>
              <T size={13} muted>{money(v)} · {Math.round((v / denom) * 100)}%</T>
            </View>
            <Bar value={v / denom} height={8} color={col} />
          </View>
        ))}
      </Card>

      <Card style={{ gap: 12 }}>
        <SectionTitle right={<Pill label="From tasks" color={c.muted} />}>Labour</SectionTitle>
        <T size={12} muted>Calculated from task effort and contributor rates. Edit tasks or rates and this line follows.</T>
        <Row gap={20}>
          <Mini label="Planned" value={money(b.labour.planned)} />
          <Mini label="Logged" value={money(b.labour.actual)} />
          <Mini label="Remaining" value={money(b.labour.planned - b.labour.actual)} />
        </Row>
      </Card>

      {lines.map((l) => (
        <Card key={l.id} style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Input lazy value={l.category} onChangeText={(v) => setLine(l.id, { category: v })} placeholder="Cost category" style={{ flex: 1, fontWeight: '600' }} />
            <MiniBtn icon="trash-2" label="Delete cost line" danger onPress={() => setBudget({ lines: lines.filter((x) => x.id !== l.id) })} />
          </View>
          <Row>
            {[['planned', 'Planned ($)'], ['committed', 'Committed ($)'], ['actual', 'Spent ($)']].map(([k, label]) => (
              <View key={k} style={{ flexBasis: 110, flexGrow: 1 }}>
                <Field label={label}><NumInput value={l[k]} onChange={(v) => setLine(l.id, { [k]: v })} /></Field>
              </View>
            ))}
          </Row>
          <T size={12} muted>{money((Number(l.planned) || 0) - (Number(l.actual) || 0))} left of plan</T>
        </Card>
      ))}
      <Button label="Add cost line" icon="plus" small variant="secondary" onPress={() => setBudget({ lines: [...lines, { id: `bl${Date.now()}`, category: 'New cost line', planned: 0, committed: 0, actual: 0 }] })} />
    </View>
  );
}
