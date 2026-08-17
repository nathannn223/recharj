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
          <SettingsIcon color={colors.textDim} size={24} />
        </View>

        <View style={styles.batteryWrap}>
          <BatteryGauge level={64} size="lg" />
          <View style={styles.batteryReadout}>
            <Text style={styles.batteryPct}>64%</Text>
            <Text style={styles.batteryLbl}>Batterie sociale</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.cardHead}>Projection 7 jours</Text>
            <Text style={[styles.cardHead, { color: colors.coral }]}>2 événements</Text>
          </View>
          <Svg viewBox="0 0 260 90" width="100%" height={100}>
            <Defs>
              <SvgLinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.violetSoft} stopOpacity={0.55} />
                <Stop offset="1" stopColor={colors.violetSoft} stopOpacity={0} />
              </SvgLinearGradient>
            </Defs>
            <Path
              d="M0,26 L37,18 L74,54 L111,64 L148,38 L185,23 L222,13 L260,20 L260,90 L0,90 Z"
              fill="url(#area)"
            />
            <Polyline
              points="0,26 37,18 74,54 111,64 148,38 185,23 222,13 260,20"
              fill="none"
              stroke={colors.coral}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle cx={111} cy={64} r={5} fill={colors.surfaceScreen} stroke={colors.lime} strokeWidth={2.5} />
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
                <ChevronRightIcon color={colors.textDim} size={14} />
              </View>
            </Link>
          </View>
          <View style={{ gap: spacing[3] }}>
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
            <BoltIcon color={colors.surfaceScreen} size={20} />
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
  content: { padding: spacing[5], paddingTop: spacing[6], gap: spacing[6], paddingBottom: spacing[8] },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sub: { fontFamily: fontFamily.textRegular, fontSize: 16, color: colors.textDim },
  h1: { fontFamily: fontFamily.displaySemiBold, fontSize: 30, color: colors.text, marginTop: 2 },

  batteryWrap: { gap: spacing[3] },
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
