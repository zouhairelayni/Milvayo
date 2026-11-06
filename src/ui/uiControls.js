// /src/ui/uiControls.js
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { font, radius, useTheme } from './theme/theme';
import PressSurface from './PressSurface';
import { T, useWide } from './uiBase';
const { createCommitBuffer } = require('./commitBuffer.cjs');

export function Chip({ label, active, onPress, color, quiet = false }) {
  const { c } = useTheme();
  const style = (pressed = false) => ({
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radius.sm,
        minHeight: 44, justifyContent: 'center',
        borderWidth: 1,
        borderColor: quiet ? 'transparent' : active ? c.accentText+'55' : c.line,
        backgroundColor: active ? c.selection : 'transparent',
        opacity: pressed ? 0.7 : 1,
  });
  const content = <T size={12} weight={quiet ? '500' : '600'} color={active ? c.onSelection : color || (quiet && !active ? c.muted : c.ink)}>{label}</T>;
  if (!onPress) return <View style={style()}>{content}</View>;
  return (
    <Pressable onPress={onPress} hitSlop={2} accessibilityRole="button" accessibilityLabel={String(label)}
      accessibilityState={{ selected: !!active }} style={({ pressed, hovered, focused }) => ({ ...style(pressed), ...(focused ? { borderColor: c.accentText } : {}), backgroundColor: hovered && !active ? c.surfaceAlt : style(pressed).backgroundColor })}>
      {content}
    </Pressable>
  );
}

export function Segmented({ options, value, onChange, fill }) {
  const { c } = useTheme();
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', backgroundColor: c.surface, borderRadius: 24, padding: 4, gap: 4, alignSelf: fill ? 'stretch' : 'flex-start', flexWrap: 'wrap' }}>
      {opts.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            hitSlop={2}
            accessibilityRole="radio"
            accessibilityLabel={String(o.label)}
            accessibilityState={{checked:on}}
            style={({ pressed }) => ({ flex: fill ? 1 : undefined, minWidth: 0, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8, borderRadius: 20, minHeight: 40, justifyContent: 'center', backgroundColor: on ? c.ink : pressed ? c.elevated : 'transparent', opacity: pressed ? 0.75 : 1 })}
          >
            <T size={13} weight={on ? '500' : '400'} color={on ? c.bg : c.muted}>{o.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

// Filled capsule, tonal utility and clearly separated destructive actions.
export function Button({label,onPress,icon,variant='primary',disabled}){
 const{c}=useTheme();const primary=variant==='primary',danger=variant==='danger';
 const color=primary?c.bg:danger?c.danger:c.ink;
 return <PressSurface accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled:!!disabled}} disabled={disabled} onPress={onPress} hitSlop={3}
  containerStyle={{alignSelf:'flex-start',maxWidth:'100%',flexShrink:1}}
  style={{minHeight:46,paddingHorizontal:primary?19:14,paddingVertical:11,borderRadius:primary?24:12,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:9,
    borderWidth:primary||variant==='ghost'?0:1,borderColor:danger?c.danger+'44':c.line,backgroundColor:primary?c.ink:variant==='ghost'?'transparent':danger?c.danger+'12':c.elevated}}>
  {icon?<Feather name={icon} size={16} color={color}/>:null}<T size={13} weight="600" color={color} numberOfLines={1} style={{flexShrink:1,lineHeight:20}}>{label}</T>
 </PressSurface>;
}
export function IconBtn({icon,onPress,solid,label}){
 const{c}=useTheme();return <PressSurface accessibilityRole="button" accessibilityLabel={label||icon} onPress={onPress} hitSlop={3}
  style={{width:44,height:44,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:solid?c.ink:c.elevated,borderWidth:1,borderColor:solid?'transparent':c.line}}>
  <Feather name={icon} size={18} color={solid?c.bg:c.ink}/>
 </PressSurface>;
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
          borderColor: focused ? c.accentText : c.line,
          borderRadius: radius.sm,
          paddingHorizontal: 12,
          paddingVertical: multiline ? 12 : 9,
          minHeight: multiline ? 112 : 48,
          textAlignVertical: multiline ? 'top' : 'center',
        },
        style,
      ]}
    />
  );
}
