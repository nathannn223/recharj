import { useFocusEffect } from '@react-navigation/native';
import { Link, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, PencilIcon, PlusIcon, TrashIcon } from '@/components/icons/Icon';
import { colors, difficultyColor, fontFamily, radii, spacing } from '@/constants/theme';
import { useBattery } from '@/hooks/useBattery';
import { useEvents } from '@/hooks/useEvents';
import {
  daysBetween,
  levelBand,
  projectBattery,
  startOfToday,
  toDateKey,
  type ProjectedDay,
  type SocialEvent,
} from '@/lib/battery';
import { relativeDayLabel } from '@/lib/dates';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/**
 * Ceiling on how far ahead the projection runs, so paging far into the future
 * can't turn into a runaway simulation. Roughly two years of daily steps.
 */
const MAX_PROJECTION_DAYS = 800;

function formatDateKeyLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const formatted = new Date(y, m - 1, d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

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
  const { events, loading, refresh, deleteEvent } = useEvents();
  const battery = useBattery(events, !loading);

  const now = startOfToday();
  const todayKey = toDateKey(now);

  // A check-in made from app/checkin.tsx (or an event change on another
  // screen) happens in a different screen instance — resyncing on every
  // focus is what picks that up instead of showing stale state until
  // something else happens to change `events`.
  useFocusEffect(
    useCallback(() => {
      battery.resync();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  // First of the displayed month. Kept as its own state so paging never
  // touches `now`, which stays the real "today" for highlighting and for the
  // projection's starting point.
  const [viewMonth, setViewMonth] = useState<Date>(new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isCurrentMonth = viewMonth.getFullYear() === now.getFullYear() && viewMonth.getMonth() === now.getMonth();

  const shiftMonth = (delta: number) => {
    setSelectedDateKey(null);
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  };

  const goToToday = () => {
    setSelectedDateKey(null);
    setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const weeks = monthGrid(viewMonth.getFullYear(), viewMonth.getMonth());
  const monthTitle = capitalize(viewMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));

  // Project far enough to cover every future day still visible in this
  // month's grid. A month entirely in the past needs no projection at all —
  // those days read their persisted level from `battery.history` instead.
  const lastCell = weeks[weeks.length - 1].filter(Boolean).pop() as Date | undefined;
  const rawHorizon = lastCell ? daysBetween(now, lastCell) + 1 : 1;
  const horizonDays = Math.min(Math.max(1, rawHorizon), MAX_PROJECTION_DAYS);
  const projection = projectBattery(events, horizonDays, now, battery.anchor);
  const projectedByDate = new Map<string, ProjectedDay>(projection.map((p) => [p.date, p]));

  const eventsByDate = new Map<string, SocialEvent[]>();
  for (const ev of events) {
    const list = eventsByDate.get(ev.eventDate) ?? [];
    list.push(ev);
    eventsByDate.set(ev.eventDate, list);
  }

  const upcomingEvents = events.filter((e) => e.eventDate >= todayKey).slice(0, 8);
  const selectedEvents = selectedDateKey ? eventsByDate.get(selectedDateKey) ?? [] : [];
  const selectedCheckIn = selectedDateKey ? battery.checkIns.get(selectedDateKey) ?? null : null;

  const selectEventDay = (dateKey: string) => {
    const [y, m] = dateKey.split('-').map(Number);
    setViewMonth(new Date(y, m - 1, 1));
    setSelectedDateKey(dateKey);
  };

  const confirmDelete = (event: SocialEvent) => {
    Alert.alert(
      "Supprimer cet événement ?",
      `« ${event.title || event.type} » sera retiré de ton calendrier. Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(event.id);
            const { error } = await deleteEvent(event.id);
            setDeletingId(null);
            if (error) {
              Alert.alert('Erreur', error);
              return;
            }
            // The projection is derived from the event list, so refreshing it
            // is enough for today and the future; resync() rewrites today's
            // persisted row so the Dashboard gauge agrees.
            await refresh();
            battery.resync();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <View>
            <Text style={styles.sub}>{monthTitle}</Text>
            <Text style={styles.h1}>Calendrier</Text>
          </View>
          <Link href="/add-event" asChild>
            <Pressable style={styles.addBtn}>
              <PlusIcon color={colors.surfaceScreen} size={22} />
            </Pressable>
          </Link>
        </View>

        <View>
          <View style={styles.monthNav}>
            <Pressable onPress={() => shiftMonth(-1)} hitSlop={10} style={styles.monthNavBtn}>
              <ChevronLeftIcon color={colors.textDim} size={20} />
            </Pressable>
            {isCurrentMonth ? (
              <Text style={styles.monthNavLabel}>{monthTitle}</Text>
            ) : (
              <Pressable onPress={goToToday} hitSlop={8} style={styles.todayBtn}>
                <Text style={styles.todayBtnText}>Aujourd'hui</Text>
              </Pressable>
            )}
            <Pressable onPress={() => shiftMonth(1)} hitSlop={10} style={styles.monthNavBtn}>
              <ChevronRightIcon color={colors.textDim} size={20} />
            </Pressable>
          </View>

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
                  const isSelected = key === selectedDateKey;
                  const dayEvents = eventsByDate.get(key) ?? [];
                  const primaryEvent = dayEvents[0];
                  const hasCheckIn = battery.checkIns.has(key);
                  // Past days read the level actually recorded that day;
                  // today and later read the live projection.
                  const level = isPast ? battery.history.get(key) : projectedByDate.get(key)?.level;
                  return (
                    <Pressable
                      key={i}
                      onPress={() => setSelectedDateKey((prev) => (prev === key ? null : key))}
                      style={[styles.cell, isToday && styles.cellToday, isSelected && !isToday && styles.cellSelected]}
                    >
                      <Text style={[styles.cellText, isToday && styles.cellTextToday, isPast && styles.cellTextPast]}>
                        {date.getDate()}
                      </Text>
                      {primaryEvent && <View style={[styles.dot, { backgroundColor: difficultyColor(primaryEvent.difficulty) }]} />}
                      {hasCheckIn && (
                        <View style={styles.checkinDot}>
                          <CheckIcon color={isToday ? colors.surfaceScreen : colors.lime} size={8} />
                        </View>
                      )}
                      {!isToday && level !== undefined && (
                        <View
                          style={[
                            styles.bar,
                            { backgroundColor: BAND_COLOR[levelBand(level)] },
                            // A level nobody actually confirmed reads dimmer
                            // — "what's projected" vs. "what was noted".
                            isPast && !hasCheckIn && styles.barPast,
                          ]}
                        />
                      )}
                    </Pressable>
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

        {selectedDateKey && (
          <View style={styles.dayDetail}>
            <View style={styles.row}>
              <Text style={styles.dayDetailTitle}>{formatDateKeyLabel(selectedDateKey)}</Text>
              <Pressable onPress={() => setSelectedDateKey(null)} hitSlop={10}>
                <Text style={styles.dayDetailClose}>Fermer</Text>
              </Pressable>
            </View>

            {selectedCheckIn ? (
              <View style={styles.checkinNoteBox}>
                <View style={styles.row}>
                  <Text style={styles.checkinNoteScore}>{selectedCheckIn.score}/10</Text>
                  {selectedDateKey === todayKey && (
                    <Pressable onPress={() => router.push('/checkin')} hitSlop={8}>
                      <Text style={styles.checkinNoteEdit}>Modifier</Text>
                    </Pressable>
                  )}
                </View>
                {selectedCheckIn.comment && <Text style={styles.checkinNoteComment}>{selectedCheckIn.comment}</Text>}
              </View>
            ) : (
              selectedDateKey === todayKey && (
                <Pressable onPress={() => router.push('/checkin')} style={styles.checkinNotePrompt}>
                  <Text style={styles.checkinNotePromptText}>Noter cette journée</Text>
                </Pressable>
              )
            )}

            {selectedEvents.length === 0 ? (
              <Text style={styles.emptyText}>Aucun événement ce jour-là.</Text>
            ) : (
              <View style={{ gap: spacing[3] }}>
                {selectedEvents.map((ev) => (
                  <View key={ev.id} style={[styles.eventRow, deletingId === ev.id && styles.eventRowBusy]}>
                    <View style={[styles.eventDot, { backgroundColor: difficultyColor(ev.difficulty) }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.eventName}>{ev.title || ev.type}</Text>
                      {ev.description ? <Text style={styles.eventDesc}>{ev.description}</Text> : null}
                      <Text style={[styles.diffInline, { color: difficultyColor(ev.difficulty) }]}>
                        {ev.type} · {ev.difficulty}/10
                      </Text>
                    </View>
                    <View style={styles.eventActions}>
                      <Pressable
                        hitSlop={8}
                        style={styles.actionBtn}
                        onPress={() => router.push({ pathname: '/add-event', params: { eventId: ev.id } })}
                      >
                        <PencilIcon color={colors.textDim} size={17} />
                      </Pressable>
                      <Pressable
                        hitSlop={8}
                        style={styles.actionBtn}
                        disabled={deletingId === ev.id}
                        onPress={() => confirmDelete(ev)}
                      >
                        <TrashIcon color={colors.critical} size={17} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View>
          <Text style={styles.sectionLabel}>Prochains événements</Text>
          {!loading && upcomingEvents.length === 0 && (
            <Text style={styles.emptyText}>Aucun événement à venir pour l'instant.</Text>
          )}
          <View style={{ gap: spacing[3] }}>
            {upcomingEvents.map((ev) => (
              <Pressable key={ev.id} style={styles.eventRow} onPress={() => selectEventDay(ev.eventDate)}>
                <View style={[styles.eventDot, { backgroundColor: difficultyColor(ev.difficulty) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventName}>{ev.title || ev.type}</Text>
                  <Text style={styles.eventWhen}>{relativeDayLabel(ev.eventDate)}</Text>
                </View>
                <Text style={[styles.diffPill, { color: difficultyColor(ev.difficulty) }]}>{ev.difficulty}/10</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const CELL_GAP = 6;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: spacing[5], paddingTop: spacing[6], gap: spacing[6], paddingBottom: spacing[8] },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sub: { fontFamily: fontFamily.textRegular, fontSize: 18, color: colors.textDim },
  h1: { fontFamily: fontFamily.displaySemiBold, fontSize: 34, color: colors.text, marginTop: 2 },

  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },

  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3] },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavLabel: { fontFamily: fontFamily.textSemiBold, fontSize: 15, color: colors.textDim },
  todayBtn: {
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.violet,
    backgroundColor: 'rgba(108,79,224,0.16)',
    paddingVertical: 7,
    paddingHorizontal: 16,
  },
  todayBtnText: { fontFamily: fontFamily.textSemiBold, fontSize: 13, color: colors.text },

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
  cellSelected: { borderWidth: 2, borderColor: colors.violetSoft },
  cellText: { fontFamily: fontFamily.textSemiBold, fontSize: 14, color: colors.textDim },
  cellTextToday: { color: colors.surfaceScreen, fontFamily: fontFamily.textBold },
  cellTextPast: { color: colors.textFaint },
  dot: { position: 'absolute', top: 6, right: 6, width: 5, height: 5, borderRadius: 3 },
  checkinDot: { position: 'absolute', top: 5, left: 5, alignItems: 'center', justifyContent: 'center' },
  bar: { position: 'absolute', left: 4, right: 4, bottom: 4, height: 4, borderRadius: 2 },
  // Recorded history is shown dimmer than the live projection, so the eye
  // reads "what happened" and "what is coming" as two different things.
  barPast: { opacity: 0.45 },

  legend: { flexDirection: 'row', gap: 18, marginTop: 10, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 4.5 },
  legendText: { fontFamily: fontFamily.textRegular, fontSize: 13, color: colors.textDim },

  sectionLabel: { fontFamily: fontFamily.textBold, fontSize: 13, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  emptyText: { fontFamily: fontFamily.textRegular, fontSize: 14, color: colors.textFaint, marginBottom: spacing[2] },

  dayDetail: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
    padding: spacing[4],
    gap: spacing[3],
  },
  dayDetailTitle: { flex: 1, fontFamily: fontFamily.textBold, fontSize: 15, color: colors.text },
  dayDetailClose: { fontFamily: fontFamily.textSemiBold, fontSize: 13, color: colors.textFaint },

  checkinNoteBox: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    padding: spacing[3],
    gap: 4,
  },
  checkinNoteScore: { fontFamily: fontFamily.displaySemiBold, fontSize: 18, color: colors.lime },
  checkinNoteEdit: { fontFamily: fontFamily.textSemiBold, fontSize: 13, color: colors.violetSoft },
  checkinNoteComment: { fontFamily: fontFamily.textRegular, fontSize: 14, color: colors.textDim, lineHeight: 20 },
  checkinNotePrompt: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.violet,
    borderRadius: radii.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  checkinNotePromptText: { fontFamily: fontFamily.textSemiBold, fontSize: 14, color: colors.violetSoft },

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
  eventRowBusy: { opacity: 0.5 },
  eventDot: { width: 10, height: 10, borderRadius: 5 },
  eventName: { fontFamily: fontFamily.textSemiBold, fontSize: 16, color: colors.text },
  eventWhen: { fontFamily: fontFamily.textRegular, fontSize: 14, color: colors.textDim, marginTop: 2 },
  eventDesc: { fontFamily: fontFamily.textRegular, fontSize: 13, color: colors.textFaint, marginTop: 3, lineHeight: 18 },
  diffInline: { fontFamily: fontFamily.textMedium, fontSize: 12.5, marginTop: 4 },
  diffPill: { fontFamily: fontFamily.textBold, fontSize: 15 },

  eventActions: { flexDirection: 'row', gap: 4 },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
