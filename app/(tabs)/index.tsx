import { useFocusEffect } from '@react-navigation/native';
import { Link, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, Polyline, Stop } from 'react-native-svg';

import { BatteryGauge } from '@/components/BatteryGauge';
import { CheckInCard } from '@/components/CheckInCard';
import { StreakBadge } from '@/components/StreakBadge';
import { BoltIcon, ChevronRightIcon } from '@/components/icons/Icon';
import { colors, difficultyColor, fontFamily, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useBattery } from '@/hooks/useBattery';
import { useEvents } from '@/hooks/useEvents';
import { addDays, projectBattery, startOfToday, toDateKey } from '@/lib/battery';
import { fetchCheckInStreak } from '@/lib/checkins';
import { relativeDayLabel } from '@/lib/dates';
import { tagsForEventType } from '@/lib/eventTags';
import { scheduleCheckInReminder, scheduleDailyReminder } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

const WEEKDAY_LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']; // Date#getDay(): 0=dimanche

const CHART_W = 260;
const CHART_TOP = 8;
const CHART_BOTTOM = 78;

function levelToY(level: number) {
  return CHART_TOP + ((100 - level) / 100) * (CHART_BOTTOM - CHART_TOP);
}

export default function DashboardScreen() {
  const { session } = useAuth();
  const { events, loading } = useEvents();
  const now = startOfToday();
  const todayKey = toDateKey(now);

  // The hero gauge reads the user's REAL carried-forward level, caught up
  // from `battery_days` (see lib/batteryStore.ts), not a fresh simulation
  // that would restart from a full battery every day.
  const battery = useBattery(events, !loading);
  const projection = projectBattery(events, 7, now, battery.anchor);
  const todayLevel = battery.level;
  const todayCheckIn = battery.checkIns.get(todayKey) ?? null;

  const [checkInStreak, setCheckInStreak] = useState(0);
  const [firstName, setFirstName] = useState('');

  // A check-in made from app/checkin.tsx (or an event added/edited/deleted
  // elsewhere) happens in a different screen instance — resyncing on every
  // focus is what picks that up here instead of showing stale state until
  // something else happens to change `events`.
  useFocusEffect(
    useCallback(() => {
      battery.resync();
      if (session) fetchCheckInStreak(session.user.id).then(setCheckInStreak);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session])
  );

  const points = projection.map((day, i) => {
    const x = (i / (projection.length - 1)) * CHART_W;
    const y = levelToY(day.level);
    return { x, y };
  });
  const linePoints = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath =
    points.length > 0
      ? `M${linePoints.split(' ').join(' L')} L${CHART_W},90 L0,90 Z`
      : '';

  const eventsThisWeek = projection.reduce((sum, d) => sum + d.events.length, 0);

  const upcomingEvents = events
    .filter((e) => e.eventDate >= toDateKey(now))
    .slice(0, 3);

  const difficultEvent = upcomingEvents.find((e) => e.difficulty >= 7);
  const [recommendedCourse, setRecommendedCourse] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    if (!difficultEvent) {
      setRecommendedCourse(null);
      return;
    }
    const tags = tagsForEventType(difficultEvent.type);
    if (tags.length === 0) {
      setRecommendedCourse(null);
      return;
    }
    let cancelled = false;
    supabase
      .from('courses')
      .select('id, title')
      .contains('tags', tags)
      .order('order_index', { ascending: true })
      .limit(1)
      .then(({ data }) => {
        if (!cancelled) setRecommendedCourse(data?.[0] ?? null);
      });
    return () => {
      cancelled = true;
    };
    // difficultEvent is a fresh object every render (derived via .find()
    // above); depending on it directly would refetch on every render
    // instead of only when the underlying event actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficultEvent?.id]);

  // Reschedules the daily reminder (lib/notifications.ts) with what's
  // actually true right now, every time this screen has fresh data —
  // onboarding only ever sets the initial "battery will be low" promise,
  // this is what keeps it honest afterwards. No-ops on its own if
  // permission was never granted.
  useEffect(() => {
    if (loading) return;
    let cancelled = false;

    async function refreshReminder() {
      // Split on purpose: low_battery_moment (migration 012) may not exist
      // yet on every Supabase project, and a combined select fails
      // entirely over a single unknown column (the exact bug already found
      // twice before with free_course_id) — which would have taken
      // first_name down with it and silently left the greeting blank.
      const { data: profile } = await supabase.from('profiles').select('first_name').maybeSingle();
      if (!cancelled) setFirstName(profile?.first_name || '');
      const { data: momentProfile } = await supabase.from('profiles').select('low_battery_moment').maybeSingle();
      const momentLabel = momentProfile?.low_battery_moment || 'Le soir';

      let discoverCourse: { id: string; title: string } | null = null;
      if (!difficultEvent || !recommendedCourse) {
        const { data: completedRows } = await supabase.from('course_progress').select('course_id').eq('status', 'completed');
        const completedIds = (completedRows ?? []).map((r) => r.course_id);
        let query = supabase.from('courses').select('id, title').order('order_index', { ascending: true }).limit(1);
        if (completedIds.length > 0) query = query.not('id', 'in', `(${completedIds.join(',')})`);
        const { data: nextCourse } = await query.maybeSingle();
        discoverCourse = nextCourse ?? null;
      }

      if (cancelled) return;
      await scheduleDailyReminder({
        momentLabel,
        batteryLevel: todayLevel,
        upcomingEvent: difficultEvent ? { title: difficultEvent.title, type: difficultEvent.type } : null,
        matchedCourse: recommendedCourse,
        discoverCourse,
      });
      await scheduleCheckInReminder(checkInStreak, !!todayCheckIn);
    }

    refreshReminder();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, todayLevel, difficultEvent?.id, recommendedCourse?.id, todayCheckIn, checkInStreak]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <Text style={styles.h1}>Bonjour{firstName ? ` ${firstName}` : ''}</Text>
          <StreakBadge streak={checkInStreak} onPress={() => router.push('/checkin')} />
        </View>

        <View style={styles.batteryWrap}>
          <BatteryGauge level={todayLevel} size="lg" style={styles.battery} />
          <View style={styles.batteryReadout}>
            <Text style={styles.batteryPct}>{todayLevel}%</Text>
            <Text style={styles.batteryLbl}>Batterie sociale</Text>
          </View>
        </View>

        <CheckInCard checkedIn={todayCheckIn} streak={checkInStreak} onPress={() => router.push('/checkin')} />

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.cardHead}>Projection 7 jours</Text>
            <Text style={[styles.cardHead, { color: colors.coral }]}>
              {eventsThisWeek} événement{eventsThisWeek === 1 ? '' : 's'}
            </Text>
          </View>
          <Svg viewBox="0 0 260 90" width="100%" height={100}>
            <Defs>
              <SvgLinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.violetSoft} stopOpacity={0.55} />
                <Stop offset="1" stopColor={colors.violetSoft} stopOpacity={0} />
              </SvgLinearGradient>
            </Defs>
            {areaPath ? <Path d={areaPath} fill="url(#area)" /> : null}
            <Polyline
              points={linePoints}
              fill="none"
              stroke={colors.coral}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points[0] && (
              <Circle cx={points[0].x} cy={points[0].y} r={5} fill={colors.surfaceScreen} stroke={colors.lime} strokeWidth={2.5} />
            )}
          </Svg>
          <View style={styles.chartDays}>
            {projection.map((day, i) => {
              const d = addDays(now, i);
              return (
                <Text key={day.date} style={[styles.chartDay, i === 0 && { color: colors.lime, fontFamily: fontFamily.textBold }]}>
                  {WEEKDAY_LETTERS[d.getDay()]}
                </Text>
              );
            })}
          </View>
        </View>

        <View>
          <View style={styles.row}>
            <Text style={styles.sectionLabel}>Événements à venir</Text>
            <Link href="/(tabs)/calendar" style={styles.seeAll}>
              <View style={styles.seeAllInner}>
                <Text style={styles.seeAllText}>Voir tout</Text>
                <ChevronRightIcon color={colors.textDim} size={14} />
              </View>
            </Link>
          </View>
          {!loading && upcomingEvents.length === 0 && (
            <Text style={styles.emptyText}>Aucun événement à venir. Ajoute-en un depuis le calendrier.</Text>
          )}
          <View style={{ gap: spacing[3] }}>
            {upcomingEvents.map((ev) => (
              <View key={ev.id} style={styles.eventRow}>
                <View style={[styles.eventDot, { backgroundColor: difficultyColor(ev.difficulty) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventName}>{ev.title || ev.type}</Text>
                  <Text style={styles.eventWhen}>{relativeDayLabel(ev.eventDate)}</Text>
                </View>
                <Text style={[styles.diffPill, { color: difficultyColor(ev.difficulty) }]}>{ev.difficulty}/10</Text>
              </View>
            ))}
          </View>
        </View>

        {difficultEvent && (
          <Link href={recommendedCourse ? `/course/${recommendedCourse.id}` : '/(tabs)/library'} asChild>
            <Pressable style={styles.recCard}>
              <View style={styles.recBadge}>
                <BoltIcon color={colors.surfaceScreen} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recTitle}>{recommendedCourse ? recommendedCourse.title : "Un cours pour t'y préparer"}</Text>
                <Text style={styles.recNote}>Recommandé pour "{difficultEvent.type}"</Text>
              </View>
            </Pressable>
          </Link>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: spacing[5], paddingTop: spacing[6], gap: spacing[6], paddingBottom: spacing[8] },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h1: { fontFamily: fontFamily.displaySemiBold, fontSize: 34, color: colors.text, marginTop: 2 },

  batteryWrap: { gap: spacing[3] },
  battery: { width: '90%', alignSelf: 'center' },
  batteryReadout: { alignItems: 'center', gap: 4 },
  batteryPct: { fontFamily: fontFamily.displayBold, fontSize: 44, color: colors.text },
  batteryLbl: { fontFamily: fontFamily.textSemiBold, fontSize: 14, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1.4 },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
    padding: spacing[4],
    gap: 6,
  },
  cardHead: { fontFamily: fontFamily.textMedium, fontSize: 14, color: colors.textDim },
  chartDays: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  chartDay: { fontFamily: fontFamily.textMedium, fontSize: 12, color: colors.textFaint, width: '14.28%', textAlign: 'center' },

  sectionLabel: { fontFamily: fontFamily.textBold, fontSize: 13, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  seeAll: { marginBottom: 10 },
  seeAllInner: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  seeAllText: { fontFamily: fontFamily.textBold, fontSize: 13, color: colors.textDim },
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

  recCard: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(108,79,224,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(139,114,238,0.4)',
    borderRadius: radii.lg,
    padding: spacing[4],
  },
  recBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recTitle: { fontFamily: fontFamily.textBold, fontSize: 16, color: colors.text },
  recNote: { fontFamily: fontFamily.textRegular, fontSize: 14, color: colors.textDim, marginTop: 3 },
});
