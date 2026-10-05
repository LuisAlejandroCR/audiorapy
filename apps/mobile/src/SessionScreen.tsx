// SessionScreen.tsx: session mode for one hand — target, support level, big ✓/✗ with haptics, undo, live streak,
// 10-trial goal and criterion. "O" is computed by the domain code. In this preview nothing is stored:
// the encrypted record is saved from the web dashboard.
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  CUE_LABEL_ES,
  CUE_LEVELS,
  objectiveText,
  summarizeTarget,
  type CueLevel,
} from '@audiorapy/domain';
import { liveStats, TRIAL_GOAL } from '@audiorapy/web-lib/stats.ts';
import type { Theme } from './theme';
import { Card, Heading, Pill } from './ui';
import { haptic, MILESTONES } from './feedback';

const TARGETS = [
  { id: 't-s-initial', label: '/s/ inicial en palabras', criterionPercent: 80 },
  { id: 't-r-simple', label: '/r/ simple en sílabas', criterionPercent: 80 },
  { id: 't-phrases', label: 'Frases de 3 elementos', criterionPercent: 80 },
];

interface Trial {
  targetId: string;
  correct: boolean;
  cue: CueLevel;
}

export function SessionScreen({ t }: { t: Theme }) {
  const [targetId, setTargetId] = useState(TARGETS[0]!.id);
  const [cue, setCue] = useState<CueLevel>('min');
  const [trials, setTrials] = useState<Trial[]>([]);
  const [finished, setFinished] = useState(false);
  const target = TARGETS.find((x) => x.id === targetId)!;
  const mine = trials.filter((x) => x.targetId === targetId);
  const stats = liveStats(
    mine.map((x) => x.correct),
    target.criterionPercent,
  );

  // A tap you can feel: ✓ light, ✗ warning; a streak milestone or the criterion reached buzzes success.
  const add = (correct: boolean) => {
    const next = [...trials, { targetId, correct, cue }];
    const after = liveStats(
      next.filter((x) => x.targetId === targetId).map((x) => x.correct),
      target.criterionPercent,
    );
    if ((after.criterionMet && !stats.criterionMet) || (correct && MILESTONES.has(after.streak)))
      haptic.milestone();
    else if (correct) haptic.correct();
    else haptic.wrong();
    setTrials(next);
  };

  if (finished) {
    const summaries = TARGETS.map((x) => ({
      targetId: x.id,
      targetLabel: x.label,
      trials: trials
        .filter((y) => y.targetId === x.id)
        .map(({ correct, cue: c }) => ({ correct, cue: c })),
    }))
      .filter((b) => b.trials.length > 0)
      .map(summarizeTarget);
    return (
      <View>
        <Heading t={t} eyebrow="Sesión terminada" title="Resumen" />
        <Card t={t}>
          <Text style={{ color: t.muted, fontWeight: '700', marginBottom: 6 }}>
            O · Objetivo (calculado de los ensayos)
          </Text>
          <Text style={{ color: t.text, fontSize: 16, lineHeight: 24 }}>
            {objectiveText(summaries)}
          </Text>
        </Card>
        <Text style={[st.note, { color: t.muted }]}>
          Vista previa: este resumen no se guarda en el teléfono. Para guardarlo cifrado, regístralo
          en el panel web.
        </Text>
        <Pill
          t={t}
          label="Nueva sesión"
          onPress={() => {
            setTrials([]);
            setFinished(false);
          }}
        />
      </View>
    );
  }

  return (
    <View>
      <Heading t={t} eyebrow="En curso · Paciente sintético A" title="Modo sesión" />
      <View style={st.wrap} accessibilityRole="radiogroup" accessibilityLabel="Objetivo">
        {TARGETS.map((x) => {
          const on = x.id === targetId;
          const n = trials.filter((y) => y.targetId === x.id).length;
          return (
            <Pressable
              key={x.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => (haptic.select(), setTargetId(x.id))}
              style={[
                st.chip,
                { borderColor: on ? t.accent : t.line, backgroundColor: on ? t.accent : t.surface },
              ]}
            >
              <Text style={{ color: on ? t.accentText : t.text, fontWeight: '600' }}>
                {x.label}
                {n > 0 ? `  · ${n}` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={st.cues} accessibilityRole="radiogroup" accessibilityLabel="Nivel de apoyo">
        {CUE_LEVELS.map((c) => {
          const on = c === cue;
          return (
            <Pressable
              key={c}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => (haptic.select(), setCue(c))}
              style={[
                st.cue,
                { borderColor: on ? t.text : t.line, backgroundColor: on ? t.text : t.surface },
              ]}
            >
              <View style={[st.dot, { backgroundColor: t.cue[c] }]} />
              <Text style={{ color: on ? t.bg : t.text, fontWeight: '600' }}>
                {CUE_LABEL_ES[c]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={st.trials}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Acierto"
          onPress={() => add(true)}
          style={({ pressed }) => [
            st.big,
            { backgroundColor: t.cue.independent, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={[st.bigText, { color: t.accentText }]}>✓</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Error"
          onPress={() => add(false)}
          style={({ pressed }) => [
            st.big,
            { backgroundColor: t.cue.max, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Text style={[st.bigText, { color: t.accentText }]}>✗</Text>
        </Pressable>
      </View>
      <Card t={t}>
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: t.text, fontWeight: '700', fontSize: 16 }}
        >
          {stats.correct}/{stats.count} en este objetivo · {trials.length} en total
        </Text>
        <View
          style={[st.bar, { backgroundColor: t.line }]}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: TRIAL_GOAL, now: Math.min(TRIAL_GOAL, stats.count) }}
        >
          <View
            style={[
              st.fill,
              { width: `${Math.round(stats.goal * 100)}%`, backgroundColor: t.accent },
            ]}
          />
        </View>
        <Text style={{ color: t.muted }}>
          {Math.min(TRIAL_GOAL, stats.count)}/{TRIAL_GOAL} ensayos · meta {target.criterionPercent}{' '}
          %
        </Text>
        <View style={st.badges}>
          <Text
            style={[
              st.badge,
              { backgroundColor: stats.streak >= 3 ? t.goldBg : t.bg, color: t.text },
            ]}
          >
            🔥 Racha {stats.streak}
          </Text>
          <Text style={[st.badge, { backgroundColor: t.bg, color: t.text }]}>
            Mejor {stats.bestStreak}
          </Text>
          {stats.criterionMet && (
            <Text style={[st.badge, { backgroundColor: t.goldBg, color: t.gold }]}>
              🏆 Meta alcanzada · {stats.percent} %
            </Text>
          )}
        </View>
      </Card>
      <View style={st.actions}>
        <Pill
          t={t}
          kind="outline"
          label="Deshacer"
          onPress={() => (haptic.select(), setTrials((ts) => ts.slice(0, -1)))}
        />
        <Pill
          t={t}
          label="Terminar sesión"
          onPress={() => trials.length > 0 && setFinished(true)}
        />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  cues: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  cue: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  trials: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  big: {
    flex: 1,
    minHeight: 110,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigText: { fontSize: 44, fontWeight: '800' },
  bar: { height: 10, borderRadius: 999, overflow: 'hidden', marginVertical: 10 },
  fill: { height: '100%', borderRadius: 999 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    overflow: 'hidden',
    fontWeight: '700',
  },
  actions: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  note: { fontSize: 13, marginBottom: 14 },
});
