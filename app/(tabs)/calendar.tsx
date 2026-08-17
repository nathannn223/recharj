import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PlusIcon } from '@/components/icons/Icon';
import { colors, fontFamily, radii, spacing } from '@/constants/theme';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

type Day = { day: number; today?: boolean; dot?: string; bar?: string };

const days: Day[] = [
  { day: 3 }, { day: 4 }, { day: 5 }, { day: 6 }, { day: 7 }, { day: 8 }, { day: 9 },
  { day: 10 }, { day: 11 }, { day: 12 }, { day: 13 }, { day: 14 }, { day: 15 }, { day: 16 },
  { day: 17, today: true },
  { day: 18 },
  { day: 19, dot: colors.coral, bar: colors.coral },
  { day: 20, bar: 'rgba(255,122,107,0.35)' },
  { day: 21, dot: colors.violetSoft, bar: colors.violetSoft },
  { day: 22, bar: 'rgba(139,114,238,0.35)' },
  { day: 23 },
  { day: 24 }, { day: 25 },
  { day: 26, dot: colors.coral, bar: colors.coral },
  { day: 27, bar: 'rgba(255,122,107,0.35)' },
  { day: 28 }, { day: 29 }, { day: 30 },
];

// Chunk into weeks of 7 so each row can be laid out as its own flex row —
// mixing flexWrap + percentage widths + gap causes RN Web to overflow the
// 7th column onto the next line, which misaligns every date.
const weeks: (Day | null)[][] = [];
for (let i = 0; i < days.length; i += 7) {
  const week: (Day | null)[] = days.slice(i, i + 7);
  while (week.length < 7) week.push(null); // keep the last row aligned under L M M J V S D
  weeks.push(week);
}

const events = [
  { id: '1', name: 'Dîner de famille', when: 'Mer. 19 août', difficulty: 7, color: colors.coral },
  { id: '2', name: 'Pot de départ collègue', when: 'Ven. 21 août', difficulty: 4, color: colors.violet },
  { id: '3', name: "Anniversaire d'un ami", when: 'Mer. 26 août', difficulty: 6, color: colors.coral },
];

export default function CalendarScreen() {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <View>
            <Text style={styles.sub}>Août 2026</Text>
            <Text style={styles.h1}>Calendrier</Text>
          </View>
          <Link href="/add-event" asChild>
            <View style={styles.addBtn}>
              <PlusIcon color={colors.surfaceScreen} size={22} />
            </View>
          </Link>
        </View>

        <View>
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((w, i) => (
              <Text key={i} style={styles.weekday}>{w}</Text>
            ))}
          </View>
          <View style={styles.grid}>
            {weeks.map((week, wi) => (
              <View key={wi} style={styles.gridRow}>
                {week.map((d, i) =>
                  d ? (
                    <View key={i} style={[styles.cell, d.today && styles.cellToday]}>
                      <Text style={[styles.cellText, d.today && styles.cellTextToday]}>{d.day}</Text>
                      {d.dot ? <View style={[styles.dot, { backgroundColor: d.dot }]} /> : null}
                      {d.bar ? <View style={[styles.bar, { backgroundColor: d.bar }]} /> : null}
                      {!d.dot && !d.today ? <View style={[styles.bar, { backgroundColor: 'rgba(232,255,94,0.35)' }]} /> : null}
                    </View>
                  ) : (
                    <View key={i} style={styles.cellEmpty} />
                  )
                )}
              </View>
            ))}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.lime }]} />
              <Text style={styles.legendText}>Bonne énergie</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.coral }]} />
              <Text style={styles.legendText}>Exigeant</Text>
            </View>
          </View>
        </View>

        <View>
          <Text style={styles.sectionLabel}>Prochains événements</Text>
          <View style={{ gap: spacing[3] }}>
            {events.map((ev) => (
              <View key={ev.id} style={styles.eventRow}>
                <View style={[styles.eventDot, { backgroundColor: ev.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventName}>{ev.name}</Text>
                  <Text style={styles.eventWhen}>{ev.when}</Text>
                </View>
                <Text style={[styles.diffPill, { color: ev.color }]}>{ev.difficulty}/10</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const CELL_GAP = 6;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: spacing[5], paddingTop: spacing[6], gap: spacing[6], paddingBottom: spacing[8] },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sub: { fontFamily: fontFamily.textRegular, fontSize: 16, color: colors.textDim },
  h1: { fontFamily: fontFamily.displaySemiBold, fontSize: 30, color: colors.text, marginTop: 2 },

  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  weekdayRow: { flexDirection: 'row', gap: CELL_GAP },
  weekday: { flex: 1, textAlign: 'center', fontFamily: fontFamily.textBold, fontSize: 12, color: colors.textFaint, textTransform: 'uppercase' },

  grid: { marginTop: 6, gap: CELL_GAP },
  gridRow: { flexDirection: 'row', gap: CELL_GAP },
  cell: {
    flex: 1,
    aspectRatio: 0.85,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cellEmpty: { flex: 1, aspectRatio: 0.85 },
  cellToday: { backgroundColor: colors.lime },
  cellText: { fontFamily: fontFamily.textSemiBold, fontSize: 14, color: colors.textDim },
  cellTextToday: { color: colors.surfaceScreen, fontFamily: fontFamily.textBold },
  dot: { position: 'absolute', top: 6, right: 6, width: 5, height: 5, borderRadius: 3 },
  bar: { position: 'absolute', left: 4, right: 4, bottom: 4, height: 4, borderRadius: 2 },

  legend: { flexDirection: 'row', gap: 18, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 4.5 },
  legendText: { fontFamily: fontFamily.textRegular, fontSize: 13, color: colors.textDim },

  sectionLabel: { fontFamily: fontFamily.textBold, fontSize: 13, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
    padding: spacing[4],
  },
  eventDot: { width: 10, height: 10, borderRadius: 5 },
  eventName: { fontFamily: fontFamily.textSemiBold, fontSize: 16, color: colors.text },
  eventWhen: { fontFamily: fontFamily.textRegular, fontSize: 14, color: colors.textDim, marginTop: 2 },
  diffPill: { fontFamily: fontFamily.textBold, fontSize: 15 },
});
