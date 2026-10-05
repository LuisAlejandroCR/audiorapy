// ui.tsx: small shared building blocks — card, KPI tile, pill button, section heading — styled from the
// active theme. Touch targets are at least 48 dp.
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { serif, type Theme } from './theme';

export function Card({ t, children, style }: { t: Theme; children: ReactNode; style?: ViewStyle }) {
  return (
    <View style={[s.card, { backgroundColor: t.surface, borderColor: t.line }, style]}>
      {children}
    </View>
  );
}

export function Heading({ t, eyebrow, title }: { t: Theme; eyebrow: string; title: string }) {
  return (
    <View style={s.heading}>
      <Text style={[s.eyebrow, { color: t.accent }]}>{eyebrow.toUpperCase()}</Text>
      <Text accessibilityRole="header" style={[s.title, { color: t.text }]}>
        {title}
      </Text>
    </View>
  );
}

export function Kpi({
  t,
  label,
  value,
  unit,
  tone,
}: {
  t: Theme;
  label: string;
  value: string;
  unit: string;
  tone?: 'warn' | 'ok';
}) {
  const color = tone === 'warn' ? t.warnText : tone === 'ok' ? t.accent : t.text;
  return (
    <View
      style={[s.kpi, { backgroundColor: t.surface, borderColor: t.line }]}
      accessible
      accessibilityLabel={`${label}: ${value}, ${unit}`}
    >
      <Text style={[s.kpiLabel, { color: t.muted }]}>{label.toUpperCase()}</Text>
      <Text style={[s.kpiValue, { color }]}>{value}</Text>
      <Text style={[s.kpiUnit, { color: t.muted }]}>{unit}</Text>
    </View>
  );
}

export function Pill({
  t,
  label,
  onPress,
  kind = 'solid',
  accessibilityLabel,
}: {
  t: Theme;
  label: string;
  onPress: () => void;
  kind?: 'solid' | 'outline';
  accessibilityLabel?: string;
}) {
  const solid = kind === 'solid';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => [
        s.pill,
        {
          backgroundColor: solid ? t.text : 'transparent',
          borderColor: solid ? t.text : t.line,
          opacity: pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text style={[s.pillText, { color: solid ? t.bg : t.text }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 18, marginBottom: 14 },
  heading: { marginBottom: 14 },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  title: { fontFamily: serif, fontSize: 28, marginTop: 2 },
  kpi: { flex: 1, minWidth: 140, borderWidth: 1, borderRadius: 18, padding: 14 },
  kpiLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  kpiValue: { fontFamily: serif, fontSize: 30, marginVertical: 2 },
  kpiUnit: { fontSize: 13 },
  pill: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: { fontSize: 15, fontWeight: '700' },
});
