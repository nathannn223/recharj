import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, Polyline, Stop } from 'react-native-svg';

import { BatteryGauge } from '@/components/BatteryGauge';
import { BoltIcon, ChevronRightIcon, SettingsIcon } from '@/components/icons/Icon';
import { colors, difficultyColor, fontFamily, radii, spacing } from '@/constants/theme';

const upcomingEvents = [
  { id: '1', name: 'Dîner de famille', when: 'Dans 2 jours', difficulty: 7 },
  { id: '2', name: 'Pot de départ collègue', when: 'Dans 4 jours', difficulty: 4 },
];

export default function DashboardScreen() {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <View>
            <Text style={styles.sub}>Bonjour Camille</Text>
            <Text style={styles.h1}>Ta semaine</Text>
          </View>
          <SettingsIcon color={colors.textDim} size={20} />
        </View>

        <View style={styles.batteryWrap}>
          <BatteryGauge level={64} size="sm" />
          <Text style={styles.batteryPct}>64%</Text>
          <Text style={styles.batteryLbl}>Batterie sociale</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.cardHead}>Projection 7 jours</Text>
            <Text style={[styles.cardHead, { color: colors.coral }]}>2 événements</Text>
          </View>
          <Svg viewBox="0 0 260 70" width="100%" height={60}>
            <Defs>
              <SvgLinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.violetSoft} stopOpacity={0.55} />
                <Stop offset="1" stopColor={colors.violetSoft} stopOpacity={0} />
              </SvgLinearGradient>
            </Defs>
            <Path
              d="M0,20 L37,14 L74,42 L111,50 L148,30 L185,18 L222,10 L260,16 L260,70 L0,70 Z"
              fill="url(#area)"
            />
            <Polyline
              points="0,20 37,14 74,42 111,50 148,30 185,18 222,10 260,16"
              fill="none"
              stroke={colors.coral}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle cx={111} cy={50} r={4} fill={colors.surfaceScreen} stroke={colors.lime} strokeWidth={2} />
          </Svg>
          <View style={styles.chartDays}>
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
              <Text key={i} style={[styles.chartDay, i === 3 && { color: colors.lime, fontFamily: fontFamily.textBold }]}>
                {d}
              </Text>
            ))}
          </View>
        </View>

        <View>
          <View style={styles.row}>
            <Text style={styles.sectionLabel}>Événements à venir</Text>
            <Link href="/(tabs)/calendar" style={styles.seeAll}>
              <View style={styles.seeAllInner}>
                <Text style={styles.seeAllText}>Voir tout</Text>
                <ChevronRightIcon color={colors.textDim} size={12} />
              </View>
            </Link>
          </View>
          <View style={{ gap: spacing[2] }}>
            {upcomingEvents.map((ev) => (
              <View key={ev.id} style={styles.eventRow}>
                <View style={[styles.eventDot, { backgroundColor: difficultyColor(ev.difficulty) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventName}>{ev.name}</Text>
                  <Text style={styles.eventWhen}>{ev.when}</Text>
                </View>
                <Text style={[styles.diffPill, { color: difficultyColor(ev.difficulty) }]}>{ev.difficulty}/10</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.recCard}>
          <View style={styles.recBadge}>
            <BoltIcon color={colors.surfaceScreen} size={16} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.recTitle}>Repas &amp; réunions de famille</Text>
            <Text style={styles.recNote}>Recommandé pour ton dîner de mardi</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: spacing[4], paddingTop: spacing[6], gap: spacing[5], paddingBottom: spacing[8] },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sub: { fontFamily: fontFamily.textRegular, fontSize: 13, color: colors.textDim },
  h1: { fontFamily: fontFamily.displaySemiBold, fontSize: 22, color: colors.text, marginTop: 2 },

  batteryWrap: { alignItems: 'center', gap: 4 },
  batteryPct: { fontFamily: fontFamily.displayBold, fontSize: 24, color: colors.text, marginTop: spacing[2] },
  batteryLbl: { fontFamily: fontFamily.textRegular, fontSize: 11, color: colors.textDim, textTransform: 'uppercase', letterSpacing: 1 },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    padding: spacing[3],
    gap: 4,
  },
  cardHead: { fontFamily: fontFamily.textMedium, fontSize: 11, color: colors.textDim },
  chartDays: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  chartDay: { fontFamily: fontFamily.textMedium, fontSize: 9, color: colors.textFaint, width: '14.28%', textAlign: 'center' },

  sectionLabel: { fontFamily: fontFamily.textBold, fontSize: 11, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  seeAll: { marginBottom: 8 },
  seeAllInner: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontFamily: fontFamily.textBold, fontSize: 11, color: colors.textDim },

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

  recCard: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: 'rgba(108,79,224,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(139,114,238,0.4)',
    borderRadius: radii.md,
    padding: spacing[3],
  },
  recBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recTitle: { fontFamily: fontFamily.textBold, fontSize: 13, color: colors.text },
  recNote: { fontFamily: fontFamily.textRegular, fontSize: 11, color: colors.textDim, marginTop: 2 },
});
