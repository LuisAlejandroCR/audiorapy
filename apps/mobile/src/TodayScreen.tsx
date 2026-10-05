// TodayScreen.tsx: the day at a glance — KPI tiles, open alerts, upcoming visits and "Cómo llegar"
// (Google Maps, Apple Maps, Waze). Addresses are typed per visit and kept in memory only in this preview.
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, Text, TextInput, View } from 'react-native';
import { agendaKpis, ALERT_ES, STATUS_ES, type ApiSettings } from '@audiorapy/web-lib/agenda.ts';
import { MAP_APPS, mapLink } from '@audiorapy/web-lib/maps.ts';
import { loadAgenda, type Loaded } from './agenda';
import type { Theme } from './theme';
import { Card, Heading, Kpi, Pill } from './ui';

export function TodayScreen({ t, settings }: { t: Theme; settings: ApiSettings }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [addresses, setAddresses] = useState<Record<string, string>>({
    '••••2233': 'Calle 45 # 12-30, Bogotá',
  });

  const refresh = useCallback(async () => {
    setLoaded(null);
    setLoaded(await loadAgenda(settings, new Date()));
  }, [settings]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!loaded)
    return (
      <View style={st.center}>
        <ActivityIndicator color={t.accent} />
        <Text style={{ color: t.muted, marginTop: 8 }}>Cargando agenda…</Text>
      </View>
    );

  const now = new Date();
  const kpi = agendaKpis(loaded.agenda, now);
  const upcoming = loaded.agenda.appointments
    .filter(
      (a) =>
        (a.status === 'scheduled' || a.status === 'confirmed') &&
        Date.parse(a.startsAt) >= now.getTime(),
    )
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const open = loaded.agenda.alerts.filter((a) => !a.resolved);

  return (
    <View>
      <Heading t={t} eyebrow="Panel diario" title="Tu agenda" />
      {loaded.source === 'demo' && (
        <Text style={[st.banner, { backgroundColor: t.warnBg, color: t.warnText }]}>
          {loaded.error
            ? `Agenda no disponible (${loaded.error}). Mostrando datos de demostración.`
            : 'Datos de demostración (sintéticos). Conecta tu agenda en Ajustes.'}
        </Text>
      )}

      <View style={[st.hero, { backgroundColor: t.hero }]}>
        <Text style={[st.heroLabel, { color: t.heroText }]}>PRÓXIMA VISITA</Text>
        <Text style={[st.heroValue, { color: t.heroText }]}>
          {upcoming[0]?.label ?? 'Sin visitas próximas'}
        </Text>
        <Text style={{ color: t.heroText }}>
          {upcoming[0] ? `Familia ${upcoming[0].contact}` : 'Tu agenda está libre'}
        </Text>
      </View>

      <View style={st.grid}>
        <Kpi t={t} label="Próximos 7 días" value={String(kpi.next7Days)} unit="visitas" />
        <Kpi
          t={t}
          label="Confirmadas"
          value={kpi.confirmedPercent === null ? '—' : `${kpi.confirmedPercent} %`}
          unit={`${kpi.upcoming - kpi.confirmed} por confirmar`}
          tone="ok"
        />
        <Kpi
          t={t}
          label="Avisos"
          value={String(kpi.openAlerts)}
          unit={kpi.openAlerts ? 'requieren respuesta' : 'todo al día'}
          tone={kpi.openAlerts ? 'warn' : 'ok'}
        />
      </View>

      {open.map((a) => (
        <Card key={a.id} t={t} style={{ backgroundColor: t.warnBg, borderColor: t.warnBg }}>
          <Text style={{ color: t.warnText, fontWeight: '800' }}>
            {ALERT_ES[a.reason] ?? a.reason}
          </Text>
          <Text style={{ color: t.warnText }}>Familia {a.contact}</Text>
        </Card>
      ))}

      {upcoming.map((a) => {
        const address = addresses[a.contact] ?? '';
        return (
          <Card key={a.id} t={t}>
            <View style={st.row}>
              <View style={{ flex: 1 }}>
                <Text style={[st.when, { color: t.text }]}>{a.label}</Text>
                <Text style={{ color: t.muted }}>Familia {a.contact}</Text>
              </View>
              <Text
                style={[
                  st.pill,
                  a.status === 'confirmed'
                    ? { backgroundColor: t.goldBg, color: t.accent }
                    : { backgroundColor: t.warnBg, color: t.warnText },
                ]}
              >
                {STATUS_ES[a.status] ?? a.status}
              </Text>
            </View>
            <TextInput
              accessibilityLabel={`Dirección de la familia ${a.contact}`}
              placeholder="Dirección (solo en este teléfono)"
              placeholderTextColor={t.muted}
              value={address}
              onChangeText={(v) => setAddresses((m) => ({ ...m, [a.contact]: v }))}
              style={[st.input, { color: t.text, borderColor: t.line, backgroundColor: t.bg }]}
            />
            <View style={st.maps}>
              {MAP_APPS.map((m) => {
                const url = mapLink(m.id, address);
                return (
                  <Pill
                    key={m.id}
                    t={t}
                    kind="outline"
                    label={m.label}
                    accessibilityLabel={`Cómo llegar con ${m.label}`}
                    onPress={() => url && void Linking.openURL(url)}
                  />
                );
              })}
            </View>
          </Card>
        );
      })}
      <Pill t={t} kind="outline" label="↻ Actualizar" onPress={() => void refresh()} />
    </View>
  );
}

const st = StyleSheet.create({
  center: { alignItems: 'center', padding: 40 },
  banner: { borderRadius: 14, padding: 12, marginBottom: 14, fontSize: 14 },
  hero: { borderRadius: 22, padding: 20, marginBottom: 12 },
  heroLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  heroValue: { fontFamily: 'serif', fontSize: 26, marginVertical: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  when: { fontSize: 17, fontWeight: '700' },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    overflow: 'hidden',
  },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginTop: 12 },
  maps: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
});
