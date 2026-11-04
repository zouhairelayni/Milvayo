// /src/screens/governance/pm/pmui.js
// Small form pieces shared by the project management screens.

import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button, Chip, Input, T } from '../../../ui/ui';
import { useStore } from '../../../governance/store';
import { useTheme } from '../../../ui/theme/theme';
import { emptyRow } from '../../../governance/pm';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const Field = ({ label, children, hint, style }) => (
  <View style={[{ gap: 8 }, style]}>
    <T size={12} weight="500" muted>{label}</T>
    {hint ? <T size={12} muted style={{ marginTop: -4 }}>{hint}</T> : null}
    {children}
  </View>
);

export const Row = ({ children, gap = 12 }) => <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>{children}</View>;

// Keeps what is typed and writes only a valid ISO date (or an empty value).
export function DateInput({ value, onChange, allowEmpty }) {
  const [d, setD] = useState(value || '');
  useEffect(() => setD(value || ''), [value]);
  return (
    <Input
      value={d}
      placeholder="YYYY-MM-DD"
      onChangeText={(v) => {
        setD(v);
        if (DATE.test(v)) onChange(v);
        else if (allowEmpty && v === '') onChange('');
      }}
    />
  );
}

// A number box that keeps its own text while typing and reports a real number.
export function NumInput({ value, onChange, placeholder }) {
  const show = (v) => (v === '' || v == null || Number(v) === 0 ? '' : String(v));
  const [d, setD] = useState(show(value));
  useEffect(() => {
    if (Number(d || 0) !== Number(value || 0)) setD(show(value));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Input
      value={d}
      placeholder={placeholder || '0'}
      keyboardType="numeric"
      onChangeText={(t) => {
        const clean = t.replace(/[^0-9.]/g, '');
        setD(clean);
        onChange(Number(clean) || 0);
      }}
    />
  );
}

export function MiniBtn({ icon, onPress, label, danger, disabled }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{disabled:!!disabled}}
      hitSlop={6}
      style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surfaceAlt, opacity: disabled ? 0.3 : pressed ? 0.6 : 1 })}
    >
      <Feather name={icon} size={15} color={danger ? c.accent : c.ink} />
    </Pressable>
  );
}

// Chips from the project's contributors; falls back to a text box when there are none.
export function OwnerPick({ value, onChange }) {
  const { s } = useStore();
  const names = s.contributors.map((p) => p.name);
  if (!names.length) return <Input lazy value={value || ''} onChangeText={onChange} placeholder="Name" />;
  const all = value && !names.includes(value) ? [...names, value] : names;
  return (
    <Row gap={8}>
      {all.map((n) => <Chip key={n} label={n} active={value === n} onPress={() => onChange(value === n ? '' : n)} />)}
    </Row>
  );
}

// One option per chip, optionally colourised.
export function Choice({ options, value, onChange, colors }) {
  return (
    <Row gap={8}>
      {options.map((o) => <Chip key={o} label={o} active={value === o} color={colors && colors[o]} onPress={() => onChange(o)} />)}
    </Row>
  );
}

export function ListEditor({ items, onChange, placeholder }) {
  const arr = Array.isArray(items) ? items : [];
  const set = (i, v) => onChange(arr.map((x, k) => (k === i ? v : x)));
  return (
    <View style={{ gap: 8 }}>
      {arr.map((it, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Input lazy value={it} onChangeText={(v) => set(i, v)} placeholder={placeholder || 'Add detail'} style={{ flex: 1 }} />
          <MiniBtn icon="x" label="Remove item" onPress={() => onChange(arr.filter((_, k) => k !== i))} />
        </View>
      ))}
      <Button label="Add item" icon="plus" small variant="ghost" onPress={() => onChange([...arr, ''])} />
    </View>
  );
}

// Rows of typed columns. On a phone a row is a small card, so nothing needs sideways scrolling.
export function TableEditor({ cols, rows, onChange, addLabel = 'Add row' }) {
  const { c } = useTheme();
  const arr = Array.isArray(rows) ? rows : [];
  const set = (id, key, v) => onChange(arr.map((r) => (r.id === id ? { ...r, [key]: v } : r)));
  return (
    <View style={{ gap: 10 }}>
      {arr.map((r, n) => (
        <View key={r.id} style={{ gap: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: c.line, backgroundColor: c.bg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <T size={12} weight="500" muted>Row {n + 1}</T>
            <MiniBtn icon="trash-2" label="Delete row" danger onPress={() => onChange(arr.filter((x) => x.id !== r.id))} />
          </View>
          <Row>
            {cols.map((col, ci) => (
              <View key={col.key} style={{ flexBasis: ci === 0 || col.kind === 'choice' ? '100%' : 150, flexGrow: 1, flexShrink: 1, gap: 6 }}>
                <T size={11} weight="600" muted>{col.label}</T>
                {col.kind === 'choice' ? (
                  <Choice options={col.options} value={r[col.key]} onChange={(v) => set(r.id, col.key, v)} />
                ) : col.kind === 'number' ? (
                  <NumInput value={r[col.key]} onChange={(v) => set(r.id, col.key, v)} />
                ) : col.kind === 'date' ? (
                  <DateInput value={r[col.key]} allowEmpty onChange={(v) => set(r.id, col.key, v)} />
                ) : (
                  <Input lazy value={r[col.key] || ''} onChangeText={(v) => set(r.id, col.key, v)} multiline={col.key === 'description'} style={col.key === 'description' ? { minHeight: 56 } : null} />
                )}
              </View>
            ))}
          </Row>
        </View>
      ))}
      <Button label={addLabel} icon="plus" small variant="ghost" onPress={() => onChange([...arr, emptyRow(cols)])} />
    </View>
  );
}
