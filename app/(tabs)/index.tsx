import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, Polyline, Stop } from 'react-native-svg';

import { BatteryGauge } from '@/components/BatteryGauge';
import { BoltIcon, ChevronRightIcon, SettingsIcon } from '@/components/icons/Icon';
import { colors, difficultyColor, fontFamily, radii, spacing } from '@/constants/theme';
import { useEvents } from '@/hooks/useEvents';
import { addDays, projectBattery, startOfToday, toDateKey } from '@/lib/battery';
import { relativeDayLabel } from '@/lib/dates';

const WEEKDAY_LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']; // Date#getDay(): 0=dimanche

const CHART_W = 260;
const CHART_TOP = 8;
const CHART_BOTTOM = 78;

function levelToY(level: number) {
  return CHART_TOP + ((100 - level) / 100) * (CHART_BOTTOM - CHART_TOP);
}

export default function DashboardScreen() {
  const { events, loading } = useEvents();

  const projection = projectBattery(events, 7);
  const today = projection[0];
  const todayLevel = Math.round(today?.level ?? 100);

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

  const now = startOfToday();
  const upcomingEvents = events
    .filter((e) => e.eventDate >= toDateKey(now))
    .slice(0, 3);

  const hasDifficultEvent = upcomingEvents.some((e) => e.difficulty >= 7);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <View>
            <Text style={styles.sub}>Bonjour</Text>
            <Text style={styles.h1}>Ta semaine</Text>
          </View>
          <SettingsIcon color={colors.textDim} size={24} />
        </View>

        <View style={styles.batteryWrap}>
          <BatteryGauge level={todayLevel} size="lg" style={styles.battery} />
          <View style={styles.batteryReadout}>
            <Text style={styles.batteryPct}>{todayLevel}%</Text>
            <Text style={styles.batteryLbl}>Batterie sociale</Text>
          </View>
        </View>

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
                  <Text style={styles.eventName}>{ev.type}</Text>
                  <Text style={styles.eventWhen}>{relativeDayLabel(ev.eventDate)}</Text>
                </View>
                <Text style={[styles.diffPill, { color: difficultyColor(ev.difficulty) }]}>{ev.difficulty}/10</Text>
              </View>
            ))}
          </View>
        </View>

        {hasDifficultEvent && (
          <Link href="/course/2" asChild>
            <View style={styles.recCard}>
              <View style={styles.recBadge}>
                <BoltIcon color={colors.surfaceScreen} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recTitle}>Un cours pour t'y préparer</Text>
                <Text style={styles.recNote}>Un de tes événements est marqué comme exigeant</Text>
              </View>
            </View>
          </Link>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: spacing[5], paddingTop: spacing[6], gap: spacing[6], paddingBottom: spacing[8] },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sub: { fontFamily: fontFamily.textRegular, fontSize: 16, color: colors.textDim },
  h1: { fontFamily: fontFamily.displaySemiBold, fontSize: 30, color: colors.text, marginTop: 2 },

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
