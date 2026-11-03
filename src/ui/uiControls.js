// /src/ui/uiControls.js
import { useEffect, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { font, radius, useTheme } from './theme/theme';
import { T } from './uiBase';
const { createCommitBuffer } = require('./commitBuffer.cjs');

export function Chip({ label, active, onPress, color }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => ({
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: radius.sm,
        minHeight: 36, justifyContent: 'center',
        borderWidth: 1,
        borderColor: active ? c.ink : c.line,
        backgroundColor: active ? c.ink : 'transparent',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <T size={13} weight="600" color={active ? c.bg : color || c.ink}>{label}</T>
    </Pressable>
  );
}

export function Segmented({ options, value, onChange, fill }) {
  const { c } = useTheme();
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <View style={{ flexDirection: 'row', backgroundColor: c.surfaceAlt, borderRadius: radius.sm, padding: 3, alignSelf: fill ? 'stretch' : 'flex-start', flexWrap: 'wrap' }}>
      {opts.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            style={{ flex: fill ? 1 : undefined, alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 7, minHeight: 34, justifyContent: 'center', backgroundColor: on ? c.surface : 'transparent' }}
          >
            <T size={13} weight="600" color={on ? c.ink : c.muted}>{o.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Button({ label, onPress, icon, variant = 'primary', small, disabled }) {
  const { c } = useTheme();
  const primary = variant === 'primary';
  const fg = primary ? c.accentInk : variant === 'danger' ? c.accent : c.ink;
  const bg = primary ? c.accent : variant === 'ghost' ? 'transparent' : c.surface;
  return (
    <Pressable
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-start', maxWidth:'100%', flexShrink:1,
        paddingHorizontal: small ? 12 : 16,
        paddingVertical: small ? 7 : 11,
        borderRadius: radius.sm, minHeight: small ? 36 : 42,
        backgroundColor: bg,
        borderWidth: primary ? 0 : 1,
        borderColor: c.line,
        opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
      })}
    >
      {icon ? <Feather name={icon} size={small ? 14 : 16} color={fg} /> : null}
      <T size={small ? 13 : 14} weight="600" color={fg} style={{flexShrink:1,lineHeight:small?18:20}}>{label}</T>
    </Pressable>
  );
}

export function IconBtn({ icon, onPress, solid, label }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label || icon}
      accessibilityRole="button"
      style={({ pressed }) => ({
        width: 38, height: 38, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center',
        backgroundColor: solid ? c.accent : c.surfaceAlt, opacity: pressed ? 0.7 : 1,
      })}
    >
      <Feather name={icon} size={17} color={solid ? c.accentInk : c.ink} />
    </Pressable>
  );
}

// lazy: keep the typed text here and pass it to onChangeText once typing pauses (300 ms), on blur, on submit and on unmount.
// Use it for fields that save into the store on every change; plain fields behave as before.
export function Input({ value, onChangeText, placeholder, style, multiline, onSubmitEditing, keyboardType, editable = true, autoFocus, onBlur, lazy = false, secure = false, accessibilityLabel }) {
  const { c } = useTheme();
  const [text, setText] = useState(value);
  const latest = useRef(onChangeText);
  latest.current = onChangeText;
  const buffer = useRef(null);
  if (!buffer.current) buffer.current = createCommitBuffer((v) => latest.current && latest.current(v));
  useEffect(() => { if (lazy && !buffer.current.hasPending()) setText(value); }, [value, lazy]);
  useEffect(() => () => buffer.current.flush(), []);
  const change = (v) => { if (!lazy) { onChangeText && onChangeText(v); return; } setText(v); buffer.current.push(v); };
  return (
    <TextInput
      value={lazy ? text : value}
      accessibilityLabel={accessibilityLabel}
      onChangeText={change}
      placeholder={placeholder}
      placeholderTextColor={c.faint}
      multiline={multiline}
      editable={editable}
      autoFocus={autoFocus}
      onBlur={() => { if (lazy) buffer.current.flush(); onBlur && onBlur(); }}
      onSubmitEditing={(e) => { if (lazy) buffer.current.flush(); onSubmitEditing && onSubmitEditing(e); }}
      keyboardType={keyboardType}
      // Password fields: masked, no suggestions, no spell-check or auto-capitalisation that would copy the text elsewhere.
      secureTextEntry={secure}
      autoCapitalize={secure ? 'none' : undefined}
      autoCorrect={secure ? false : undefined}
      spellCheck={secure ? false : undefined}
      contextMenuHidden={secure || undefined}
      style={[
        {
          fontFamily: font,
          color: c.ink,
          fontSize: 14,
          backgroundColor: c.surfaceAlt,
          borderRadius: radius.sm,
          paddingHorizontal: 12,
          paddingVertical: multiline ? 10 : 9,
          minHeight: multiline ? 80 : 0,
          textAlignVertical: multiline ? 'top' : 'center',
        },
        style,
      ]}
    />
  );
}
