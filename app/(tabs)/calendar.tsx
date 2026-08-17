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
              <PlusIcon color={colors.surfaceScreen} size={16} />
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
          <View style={{ gap: spacing[2] }}>
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

const CELL_GAP = 4;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: spacing[4], paddingTop: spacing[6], gap: spacing[5], paddingBottom: spacing[8] },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sub: { fontFamily: fontFamily.textRegular, fontSize: 13, color: colors.textDim },
  h1: { fontFamily: fontFamily.displaySemiBold, fontSize: 22, color: colors.text, marginTop: 2 },

  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  weekdayRow: { flexDirection: 'row', gap: CELL_GAP },
  weekday: { flex: 1, textAlign: 'center', fontFamily: fontFamily.textBold, fontSize: 9, color: colors.textFaint, textTransform: 'uppercase' },

  grid: { marginTop: 4, gap: CELL_GAP },
  gridRow: { flexDirection: 'row', gap: CELL_GAP },
  cell: {
    flex: 1,
    aspectRatio: 0.95,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  cellEmpty: { flex: 1, aspectRatio: 0.95 },
  cellToday: { backgroundColor: colors.lime },
  cellText: { fontFamily: fontFamily.textSemiBold, fontSize: 10, color: colors.textDim },
  cellTextToday: { color: colors.surfaceScreen, fontFamily: fontFamily.textBold },
  dot: { position: 'absolute', top: 4, right: 4, width: 4, height: 4, borderRadius: 2 },
  bar: { position: 'absolute', left: 3, right: 3, bottom: 3, height: 3, borderRadius: 2 },

  legend: { flexDirection: 'row', gap: 14, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 3.5 },
  legendText: { fontFamily: fontFamily.textRegular, fontSize: 9.5, color: colors.textDim },

  sectionLabel: { fontFamily: fontFamily.textBold, fontSize: 11, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    padding: spacing[3],
  },
  eventDot: { width: 8, height: 8, borderRadius: 4 },
  eventName: { fontFamily: fontFamily.textSemiBold, fontSize: 13, color: colors.text },
  eventWhen: { fontFamily: fontFamily.textRegular, fontSize: 11, color: colors.textDim, marginTop: 1 },
  diffPill: { fontFamily: fontFamily.textBold, fontSize: 11 },
});
