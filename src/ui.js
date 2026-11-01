import {
  Alert, Modal, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { font, radius, serif, useTheme } from './theme';

// Breakpoint: at or above this width the app shows the sidebar layout.
export const useWide = () => useWindowDimensions().width >= 880;

export function T({ children, size = 14, weight = '400', color, muted, serifFace, upper, center, numberOfLines, style, pointerEvents }) {
  const { c } = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      pointerEvents={pointerEvents}
      style={[
        {
          fontFamily: serifFace ? serif : font,
          fontSize: size,
          fontWeight: weight,
          color: color || (muted ? c.muted : c.ink),
          letterSpacing: upper ? 1 : size >= 20 ? -0.4 : 0,
          textTransform: upper ? 'uppercase' : 'none',
          textAlign: center ? 'center' : 'left',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Card({ children, style, onPress, pad = 16 }) {
  const { c } = useTheme();
  const body = (
    <View style={[{ backgroundColor: c.surface, borderRadius: radius.md, borderWidth: 1, borderColor: c.line, padding: pad }, style]}>
      {children}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      {body}
    </Pressable>
  );
}

export function Pill({ label, color }) {
  return (
    <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: color + '22' }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      <T size={11} weight="600" color={color}>{label}</T>
    </View>
  );
}

export function Chip({ label, active, onPress, color }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: radius.pill,
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
    <View style={{ flexDirection: 'row', backgroundColor: c.surfaceAlt, borderRadius: radius.pill, padding: 3, alignSelf: fill ? 'stretch' : 'flex-start', flexWrap: 'wrap' }}>
      {opts.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            style={{ flex: fill ? 1 : undefined, alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: on ? c.surface : 'transparent' }}
          >
            <T size={13} weight="600" color={on ? c.ink : c.muted}>{o.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

const HUES = ['#E0512D', '#3B6FE0', '#2F9E6B', '#D89614', '#8E5CD6', '#14A3B8'];
const hash = (s) => {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
};

export function Avatar({ name = '?', size = 24 }) {
  const initials = name.split(' ').map((p) => p[0] || '').slice(0, 2).join('').toUpperCase();
  const hue = HUES[hash(name) % HUES.length];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: hue + '26', borderWidth: 1, borderColor: hue + '55', alignItems: 'center', justifyContent: 'center' }}>
      <T size={Math.round(size * 0.36)} weight="700" color={hue}>{initials}</T>
    </View>
  );
}

export function Bar({ value = 0, color, height = 6, track }) {
  const { c } = useTheme();
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track || c.surfaceAlt, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', borderRadius: height, backgroundColor: color || c.accent }} />
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
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-start', maxWidth:'100%', flexShrink:1,
        paddingHorizontal: small ? 12 : 16,
        paddingVertical: small ? 7 : 11,
        borderRadius: radius.pill,
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
      style={({ pressed }) => ({
        width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
        backgroundColor: solid ? c.accent : c.surfaceAlt, opacity: pressed ? 0.7 : 1,
      })}
    >
      <Feather name={icon} size={17} color={solid ? c.accentInk : c.ink} />
    </Pressable>
  );
}

export function Input({ value, onChangeText, placeholder, style, multiline, onSubmitEditing, keyboardType, editable = true, autoFocus, onBlur }) {
  const { c } = useTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={c.faint}
      multiline={multiline}
      editable={editable}
      autoFocus={autoFocus}
      onBlur={onBlur}
      onSubmitEditing={onSubmitEditing}
      keyboardType={keyboardType}
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

// Bottom sheet on phones, right-hand drawer on wide screens.
export function Sheet({ visible, onClose, title, children, footer }) {
  const { c, mode } = useTheme();
  const wide = useWide();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaProvider style={{ flex: 1 }}>
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(27,25,21,0.35)' }}>
      <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column', justifyContent: 'flex-end', backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(27,25,21,0.35)' }}>
        <Pressable onPress={onClose} style={{ flex: 1 }} />
        <View
          style={{
            width: wide ? 540 : '100%',
            maxHeight: wide ? undefined : '90%',
            flex: wide ? 1 : undefined,
            backgroundColor: c.bg,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: wide ? 0 : radius.lg,
            borderLeftWidth: wide ? 1 : 0,
            borderColor: c.line,
            overflow: 'hidden',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 }}>
            <T serifFace size={22}>{title}</T>
            <IconBtn icon="x" onPress={onClose} label="Close" />
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 18, paddingBottom: 40 }}>{children}</ScrollView>
          {footer ? (
            <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: c.line, flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>{footer}</View>
          ) : null}
        </View>
      </View>
      </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

// Standard screen frame: serif title, optional actions, responsive gutter.
export function Page({ title, subtitle, actions, children, scrollRef, onScroll, scrollEnabled = true, scrollProps }) {
  const wide = useWide();
  return (
    <ScrollView ref={scrollRef} onScroll={onScroll} scrollEventThrottle={16} scrollEnabled={scrollEnabled} {...scrollProps} style={{ flex: 1 }} contentContainerStyle={{ padding: wide ? 32 : 16, paddingBottom: 130 }}>
      <View style={{ width: '100%', maxWidth: 1180, alignSelf: 'center', gap: wide ? 18 : 13 }}>
        {(wide || subtitle || actions) ? (
          <View style={{ flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'flex-end' : 'stretch', justifyContent: 'space-between', gap: wide ? 12 : 10, width: '100%' }}>
            <View style={{ minWidth: 0, flex: wide ? 1 : undefined, alignSelf: 'stretch', gap: wide ? 6 : 0 }}>
              {wide ? <T serifFace size={38} weight="500">{title}</T> : null}
              {subtitle ? <T muted size={wide ? 14 : 12} style={{ lineHeight: wide ? 21 : 19, flexShrink: 1 }}>{subtitle}</T> : null}
            </View>
            {actions ? <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: wide ? 'flex-end' : 'flex-start', flexWrap: 'wrap', gap: 8, flexShrink: 0, maxWidth: '100%' }}>{actions}</View> : null}
          </View>
        ) : null}
        {children}
      </View>
    </ScrollView>
  );
}

export function Grid({ children, gap = 12 }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>{children}</View>;
}

// A grid cell: `wide` basis on large screens, `mobile` basis on phones.
export function Cell({ children, wide: wBasis = '48%', mobile = '100%' }) {
  const isWide = useWide();
  return <View style={{ flexBasis: isWide ? wBasis : mobile, flexGrow: 1, flexShrink: 1 }}>{children}</View>;
}

export function Stat({ label, value, hint, accent }) {
  return (
    <Card pad={16} style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {accent ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accent }} /> : null}
        <T size={12} weight="600" muted>{label}</T>
      </View>
      <T size={30} weight="600" style={{ letterSpacing: -1 }}>{value}</T>
      {hint ? <T size={12} muted>{hint}</T> : null}
    </Card>
  );
}

export function SectionTitle({ children, right }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <T size={16} weight="600">{children}</T>
      {right}
    </View>
  );
}

export function Empty({ children }) {
  return (
    <View style={{ padding: 28, alignItems: 'center' }}>
      <T muted center>{children}</T>
    </View>
  );
}

// Real cross-platform exports; native uses SDK 58 File + Android/iOS share sheet.
export async function downloadText(name, text, mime = 'text/plain') {
  try {
    if (Platform.OS === 'web') {
      const url = URL.createObjectURL(new Blob([text], { type: mime }));
      const a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    } else {
      const safeName = String(name).replace(/[^a-zA-Z0-9_.-]/g, '_');
      const file = new File(Paths.cache, `${Date.now()}-${safeName}`);
      file.create();
      await file.write(text);
      if (!await Sharing.isAvailableAsync()) throw new Error('System file sharing unavailable');
      await Sharing.shareAsync(file.uri, {mimeType:mime, dialogTitle:'Export Niyarvo Projects file'});
    }
    return true;
  } catch (error) {
    Alert.alert('Export failed', error.message);
    return false;
  }
}
