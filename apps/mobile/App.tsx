// App.tsx: Audiorapy mobile preview — bottom tabs (Hoy, Sesión, Ajustes) in the "Terracota" palette.
// The API token lives in memory only; nothing clinical is written to the phone in this preview.
import { useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { cleanApiSettings } from '@audiorapy/web-lib/settings.ts';
import type { ApiSettings } from '@audiorapy/web-lib/agenda.ts';
import { light as t, serif, type Theme } from './src/theme';
import { TodayScreen } from './src/TodayScreen';
import { SessionScreen } from './src/SessionScreen';
import { Card, Heading, Pill } from './src/ui';

/** Set at build time once the dashboard is deployed (e.g. the Vercel URL + /app/). */
const DASHBOARD_URL = process.env.EXPO_PUBLIC_DASHBOARD_URL ?? '';

type Tab = 'today' | 'session' | 'settings';
const TABS: Array<{ id: Tab; label: string; glyph: string }> = [
  { id: 'today', label: 'Hoy', glyph: '◷' },
  { id: 'session', label: 'Sesión', glyph: '✓' },
  { id: 'settings', label: 'Ajustes', glyph: '⚙' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const [settings, setSettings] = useState<ApiSettings>({ baseUrl: '', token: '' });
  const stable = useMemo(() => settings, [settings]);

  return (
    <SafeAreaView style={[st.root, { backgroundColor: t.bg }]}>
      <StatusBar style="dark" />
      <View style={st.top}>
        <Text style={[st.brand, { color: t.text }]}>Audiorapy</Text>
        <Text style={[st.tag, { color: t.muted, borderColor: t.line }]}>vista previa</Text>
      </View>
      <ScrollView contentContainerStyle={st.body}>
        {tab === 'today' && <TodayScreen t={t} settings={stable} />}
        {tab === 'session' && <SessionScreen t={t} />}
        {tab === 'settings' && <Settings t={t} settings={settings} onSave={setSettings} />}
      </ScrollView>
      <View
        style={[st.tabs, { backgroundColor: t.surface, borderColor: t.line }]}
        accessibilityRole="tablist"
      >
        {TABS.map((x) => {
          const on = x.id === tab;
          return (
            <Pressable
              key={x.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={x.label}
              onPress={() => setTab(x.id)}
              style={[st.tab, on && { backgroundColor: t.accent }]}
            >
              <Text style={[st.glyph, { color: on ? t.accentText : t.muted }]}>{x.glyph}</Text>
              <Text style={{ color: on ? t.accentText : t.muted, fontWeight: '700', fontSize: 12 }}>
                {x.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

function Settings({
  t,
  settings,
  onSave,
}: {
  t: Theme;
  settings: ApiSettings;
  onSave: (s: ApiSettings) => void;
}) {
  const [draft, setDraft] = useState(settings);
  const [saved, setSaved] = useState(false);
  const input = [st.input, { color: t.text, borderColor: t.line, backgroundColor: t.bg }];
  return (
    <View>
      <Heading t={t} eyebrow="Conexiones" title="Ajustes" />
      <Card t={t}>
        <Text style={[st.label, { color: t.text }]}>Dirección de la API de agenda</Text>
        <TextInput
          accessibilityLabel="Dirección de la API de agenda"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="https://…"
          placeholderTextColor={t.muted}
          value={draft.baseUrl}
          onChangeText={(v) => (setDraft({ ...draft, baseUrl: v }), setSaved(false))}
          style={input}
        />
        <Text style={[st.label, { color: t.text }]}>Token del dashboard (solo en memoria)</Text>
        <TextInput
          accessibilityLabel="Token del dashboard"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          value={draft.token}
          onChangeText={(v) => (setDraft({ ...draft, token: v }), setSaved(false))}
          style={input}
        />
        <View style={{ marginTop: 14 }}>
          <Pill
            t={t}
            label={saved ? 'Guardado ✓' : 'Guardar'}
            onPress={() => {
              onSave(cleanApiSettings(draft));
              setSaved(true);
            }}
          />
        </View>
      </Card>
      <Card t={t}>
        <Text style={{ color: t.text, fontFamily: serif, fontSize: 20, marginBottom: 6 }}>
          Privacidad
        </Text>
        <Text style={{ color: t.muted, lineHeight: 21 }}>
          Esta vista previa no guarda notas clínicas en el teléfono. La bóveda cifrada, las notas
          SOAP y el respaldo viven en el panel web, cifrados en tu navegador.
        </Text>
        {DASHBOARD_URL && (
          <View style={{ marginTop: 12 }}>
            <Pill
              t={t}
              kind="outline"
              label="Abrir el panel web"
              onPress={() => void Linking.openURL(DASHBOARD_URL)}
            />
          </View>
        )}
      </Card>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
  },
  brand: { fontFamily: serif, fontSize: 24, fontWeight: '600' },
  tag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    fontSize: 12,
  },
  body: { padding: 20, paddingBottom: 120 },
  tabs: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 14,
    flexDirection: 'row',
    gap: 6,
    padding: 6,
    borderWidth: 1,
    borderRadius: 22,
  },
  tab: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  glyph: { fontSize: 18 },
  label: { fontWeight: '600', marginTop: 10, marginBottom: 6 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
});
