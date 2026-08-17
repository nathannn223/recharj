import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PlusIcon } from '@/components/icons/Icon';
import { colors, difficultyColor, fontFamily, radii, spacing } from '@/constants/theme';
import { useEvents } from '@/hooks/useEvents';
import { levelBand, projectBattery, startOfToday, toDateKey, type ProjectedDay } from '@/lib/battery';
import { relativeDayLabel } from '@/lib/dates';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const BAND_COLOR = {
  high: colors.lime,
  mid: colors.violetSoft,
  low: colors.coral,
} as const;

function monthGrid(year: number, month: number): (Date | null)[][] {
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // Monday-first index

  const cells: (Date | null)[] = new Array(firstWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export default function CalendarScreen() {
  const { events, loading } = useEvents();

  const now = startOfToday();
  const todayKey = toDateKey(now);
  const weeks = monthGrid(now.getFullYear(), now.getMonth());
  const monthTitle = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  // Project far enough to cover every future day still visible in this month's grid.
  const lastCell = weeks[weeks.length - 1].filter(Boolean).pop() as Date | undefined;
  const horizonDays = lastCell ? Math.max(1, Math.round((lastCell.getTime() - now.getTime()) / 86400000) + 1) : 1;
  const projection = projectBattery(events, horizonDays, now);
  const levelByDate = new Map<string, ProjectedDay>(projection.map((p) => [p.date, p]));

  const upcomingEvents = events.filter((e) => e.eventDate >= todayKey).slice(0, 8);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <View>
            <Text style={styles.sub}>{monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1)}</Text>
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
                {week.map((date, i) => {
                  if (!date) return <View key={i} style={styles.cellEmpty} />;
                  const key = toDateKey(date);
                  const isToday = key === todayKey;
                  const isPast = key < todayKey;
                  const projected = levelByDate.get(key);
                  const dayEvents = projected?.events ?? [];
                  const primaryEvent = dayEvents[0];
                  return (
                    <View key={i} style={[styles.cell, isToday && styles.cellToday]}>
                      <Text style={[styles.cellText, isToday && styles.cellTextToday]}>{date.getDate()}</Text>
                      {primaryEvent && <View style={[styles.dot, { backgroundColor: difficultyColor(primaryEvent.difficulty) }]} />}
                      {!isToday && !isPast && projected && (
                        <View style={[styles.bar, { backgroundColor: BAND_COLOR[levelBand(projected.level)] }]} />
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.lime }]} />
              <Text style={styles.legendText}>Bonne énergie</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.violetSoft }]} />
              <Text style={styles.legendText}>Modéré</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.coral }]} />
              <Text style={styles.legendText}>Exigeant</Text>
            </View>
          </View>
        </View>

        <View>
          <Text style={styles.sectionLabel}>Prochains événements</Text>
          {!loading && upcomingEvents.length === 0 && (
            <Text style={styles.emptyText}>Aucun événement à venir pour l'instant.</Text>
          )}
          <View style={{ gap: spacing[3] }}>
            {upcomingEvents.map((ev) => (
              <View key={ev.id} style={styles.eventRow}>
                <View style={[styles.eventDot, { backgroundColor: difficultyColor(ev.difficulty) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventName}>{ev.type}</Text>
                  <Text style={styles.eventWhen}>{relativeDayLabel(ev.eventDate)}</Text>
                </View>
                <Text style={[styles.diffPill, { color: difficultyColor(ev.difficulty) }]}>{ev.difficulty}/10</Text>
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

  legend: { flexDirection: 'row', gap: 18, marginTop: 10, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 4.5 },
  legendText: { fontFamily: fontFamily.textRegular, fontSize: 13, color: colors.textDim },

  sectionLabel: { fontFamily: fontFamily.textBold, fontSize: 13, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  emptyText: { fontFamily: fontFamily.textRegular, fontSize: 14, color: colors.textFaint, marginBottom: spacing[2] },
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
