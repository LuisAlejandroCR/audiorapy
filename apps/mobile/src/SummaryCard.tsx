// SummaryCard.tsx: the phone's executive summary — the same code-built sentence and urgency order as the
// web dashboard, four KPI tiles and the accuracy of the last sessions as a small bar chart.
import { StyleSheet, Text, View } from 'react-native';
import type { Executive } from '@audiorapy/web-lib/summary.ts';
import type { Theme } from './theme';

export function SummaryCard({ t, s, demo }: { t: Theme; s: Executive; demo: boolean }) {
  const tiles = [
    { label: 'Avisos', value: s.openAlerts, warn: s.openAlerts > 0 },
    { label: 'Por confirmar', value: s.toConfirm, warn: s.toConfirm > 0 },
    { label: '7 días', value: s.next7Days, warn: false },
    { label: 'Notas', value: s.pendingNotes, warn: s.pendingNotes > 0 },
  ];
  const last = s.trend.at(-1);
  return (
    <View
      style={[
        st.card,
        { backgroundColor: t.surface, borderColor: t.line, borderTopColor: t.accent },
      ]}
    >
      <Text style={[st.eyebrow, { color: t.accent }]}>RESUMEN EJECUTIVO</Text>
      <Text style={[st.headline, { color: t.text }]}>{s.headline}</Text>
      <View style={st.tiles}>
        {tiles.map((x) => (
          <View
            key={x.label}
            accessible
            accessibilityLabel={`${x.label}: ${x.value}`}
            style={[st.tile, { backgroundColor: x.warn ? t.warnBg : t.bg, borderColor: t.line }]}
          >
            <Text style={[st.tileValue, { color: x.warn ? t.warnText : t.text }]}>{x.value}</Text>
            <Text
              style={{ color: x.warn ? t.warnText : t.muted, fontSize: 12, textAlign: 'center' }}
            >
              {x.label}
            </Text>
          </View>
        ))}
      </View>
      {last && (
        <View
          accessible
          accessibilityLabel={`Acierto por sesión: ${s.trend.map((p) => p.percent).join(', ')} %`}
        >
          <View style={st.bars}>
            {s.trend.map((p, i) => (
              <View
                key={p.date}
                style={[
                  st.bar,
                  {
                    height: `${Math.max(6, p.percent)}%`,
                    backgroundColor: i === s.trend.length - 1 ? t.cue.independent : t.line,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={{ color: t.muted, fontSize: 12 }}>
            Acierto por sesión · última {last.percent} %{demo ? ' · datos de demostración' : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  card: { borderWidth: 1, borderTopWidth: 4, borderRadius: 20, padding: 16, marginBottom: 14 },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2, marginBottom: 6 },
  headline: { fontSize: 16, lineHeight: 22, marginBottom: 12 },
  tiles: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tile: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 10, alignItems: 'center' },
  tileValue: { fontSize: 22, fontWeight: '800' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 64, marginBottom: 6 },
  bar: { flex: 1, borderRadius: 6 },
});
