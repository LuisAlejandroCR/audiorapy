// InboxScreen.tsx: the phone's notification center — the same list as the web bell (family alerts first,
// then visits within 24 h), built by the shared code. Tapping an item marks it read.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { InboxItem } from '@audiorapy/web-lib/inbox.ts';
import type { Theme } from './theme';
import { Heading, Pill } from './ui';
import { haptic } from './feedback';

export function InboxScreen({
  t,
  items,
  onRead,
  onReadAll,
}: {
  t: Theme;
  items: InboxItem[];
  onRead: (id: string) => void;
  onReadAll: () => void;
}) {
  const unread = items.filter((i) => i.unread).length;
  return (
    <View>
      <Heading t={t} eyebrow={unread ? `${unread} sin leer` : 'Todo leído'} title="Avisos" />
      {items.length === 0 ? (
        <Text style={{ color: t.muted, fontSize: 16 }}>
          Todo al día. Aquí verás avisos de familias y visitas próximas.
        </Text>
      ) : (
        items.map((i) => (
          <Pressable
            key={i.id}
            accessibilityRole="button"
            accessibilityLabel={`${i.title}, ${i.detail}${i.unread ? ', sin leer' : ''}`}
            onPress={() => (haptic.select(), onRead(i.id))}
            style={[
              st.item,
              {
                backgroundColor: i.unread ? t.surface : t.bg,
                borderColor: i.unread ? t.accent : t.line,
              },
            ]}
          >
            <View style={[st.icon, { backgroundColor: i.kind === 'alert' ? t.warnBg : t.goldBg }]}>
              <Text style={{ fontSize: 18 }}>
                {i.kind === 'alert' ? '🔔' : i.kind === 'visit' ? '📅' : '🏅'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.text, fontWeight: i.unread ? '800' : '600' }}>{i.title}</Text>
              <Text style={{ color: t.muted }}>{i.detail}</Text>
            </View>
            {i.unread && <View style={[st.dot, { backgroundColor: t.accent }]} />}
          </Pressable>
        ))
      )}
      {unread > 0 && (
        <View style={{ marginTop: 6 }}>
          <Pill t={t} kind="outline" label="Marcar todo como leído" onPress={onReadAll} />
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
