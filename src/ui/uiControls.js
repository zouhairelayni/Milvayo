// /src/ui/uiControls.js
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { font, radius, useTheme } from './theme/theme';
import { T, useWide } from './uiBase';
const { createCommitBuffer } = require('./commitBuffer.cjs');

export function Chip({ label, active, onPress, color }) {
  const { c } = useTheme();
  const style = (pressed = false) => ({
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: radius.sm,
        minHeight: 44, justifyContent: 'center',
        borderWidth: 1,
        borderColor: active ? c.ink : c.line,
        backgroundColor: active ? c.ink : 'transparent',
        opacity: pressed ? 0.7 : 1,
  });
  const content = <T size={13} weight="600" color={active ? c.bg : color || c.ink}>{label}</T>;
  if (!onPress) return <View style={style()}>{content}</View>;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={String(label)}
      accessibilityState={{ selected: !!active }} style={({ pressed }) => style(pressed)}>
      {content}
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
            accessibilityRole="radio"
            accessibilityLabel={String(o.label)}
            accessibilityState={{checked:on}}
            style={{ flex: fill ? 1 : undefined, alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 7, minHeight: 44, justifyContent: 'center', backgroundColor: on ? c.surface : 'transparent' }}
          >
            <T size={13} weight="600" color={on ? c.ink : c.muted}>{o.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Button({ label, onPress, icon, variant = 'primary', small, disabled, headerCompact = false }) {
  const { c } = useTheme();
  const primary = variant === 'primary';
  const fg = primary ? c.accentInk : variant === 'danger' ? c.accent : c.ink;
  const bg = primary ? c.accent : variant === 'ghost' ? 'transparent' : c.surface;
  return (
    <Pressable
      disabled={disabled}
      accessibilityState={{disabled:!!disabled}}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={headerCompact ? 4 : undefined}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: headerCompact ? 6 : 8,
        alignSelf: 'flex-start', maxWidth:'100%', flexShrink:1,
        paddingHorizontal: headerCompact ? 10 : small ? 12 : 16,
        paddingVertical: headerCompact ? 6 : small ? 7 : 11,
        borderRadius: radius.sm, minHeight: headerCompact ? 40 : 44,
        backgroundColor: bg,
        borderWidth: primary ? 0 : 1,
        borderColor: c.line,
        opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
      })}
    >
      {icon ? <Feather name={icon} size={headerCompact ? 13 : small ? 14 : 16} color={fg} /> : null}
      <T size={headerCompact ? 12 : small ? 13 : 14} weight="600" color={fg} numberOfLines={1} style={{flexShrink:1,lineHeight:headerCompact ? 16 : small?18:20}}>{label}</T>
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
        width: 44, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center',
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
  const wide = useWide();
  const [text, setText] = useState(value);
  const [focused, setFocused] = useState(false);
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
      accessibilityLabel={accessibilityLabel || placeholder || undefined}
      accessibilityState={{disabled:!editable}}
      onChangeText={change}
      placeholder={placeholder}
      placeholderTextColor={c.faint}
      multiline={multiline}
      editable={editable}
      autoFocus={autoFocus}
      onFocus={() => setFocused(true)}
      onBlur={() => { setFocused(false); if (lazy) buffer.current.flush(); onBlur && onBlur(); }}
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
          fontSize: Platform.OS === 'web' && !wide ? 16 : 14, // Prevent mobile Safari from zooming the page on input focus.
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: focused ? c.accentText : c.faint + 'A8',
          borderRadius: radius.sm,
          paddingHorizontal: 12,
          paddingVertical: multiline ? 12 : 9,
          minHeight: multiline ? 104 : 44,
          textAlignVertical: multiline ? 'top' : 'center',
        },
        style,
      ]}
    />
  );
}
