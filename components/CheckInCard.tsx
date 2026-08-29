import { LinearGradient } from 'expo-linear-gradient';
import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { PencilIcon } from '@/components/icons/Icon';
import { colors, fontFamily, radii, spacing } from '@/constants/theme';

type CheckIn = { score: number; comment: string | null };

type Props = {
  checkedIn: CheckIn | null;
  streak: number;
  onPress: () => void;
};

// The streak dying is genuinely urgent only in the last 2 hours before it
// does (midnight) — matches lib/notifications.ts's dedicated warning,
// scheduled for the same hour, so the card and the notification never
// disagree about when things turn urgent.
const URGENT_HOUR = 22;

// Most of the day this is a calm, neutral prompt — loss-aversion copy this
// early would be both premature (nothing is actually at risk yet) and, over
// many hours a day, exhausting. It only leads with the streak once there's
// a real deadline behind it.
export function CheckInCard({ checkedIn, streak, onPress }: Props) {
  const pending = !checkedIn;
  const urgent = pending && streak > 0 && new Date().getHours() >= URGENT_HOUR;
  const calm = pending && !urgent;
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();

  const title = !pending
    ? streak > 1
      ? `Série protégée · ${checkedIn.score}/10`
      : `Journée notée · ${checkedIn.score}/10`
    : urgent
      ? 'Ne laisse pas ta série s\'éteindre.'
      : 'Comment s\'est passée ta journée ?';

  const note = !pending
    ? checkedIn.comment || 'Rendez-vous demain.'
    : urgent
      ? 'Touche pour la protéger avant minuit.'
      : 'Où en est ta batterie ?';

  const showStat = !pending || urgent;

  const textBlock = (
    <>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.note} numberOfLines={2}>
        {note}
      </Text>
    </>
  );

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={{ transform: [{ scale }] }}>
        {urgent ? (
          <LinearGradient
            colors={['rgba(255,122,107,0.16)', 'rgba(232,255,94,0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, styles.cardUrgent]}
          >
            <View style={styles.stripe} />
            {showStat && (
              <View style={styles.statRow}>
                <Text style={styles.statNum}>{streak}</Text>
                <Text style={styles.statUnit}>jour{streak === 1 ? '' : 's'} d'affilée</Text>
              </View>
            )}
            {textBlock}
          </LinearGradient>
        ) : calm ? (
          // Reuses the exact "violet wash + lime badge" recipe the
          // Dashboard's own recommended-course card already uses to stand
          // out against the grey surface cards around it — colorful and
          // inviting rather than alarming, since nothing is actually at
          // risk yet at this point in the day.
          <View style={[styles.card, styles.cardCalm]}>
            <View style={styles.calmBadge}>
              <PencilIcon color={colors.surfaceScreen} size={18} />
            </View>
            <View style={{ flex: 1 }}>{textBlock}</View>
          </View>
        ) : (
          <View style={[styles.card, styles.cardDone]}>
            {showStat && (
              <View style={styles.statRow}>
                <Text style={[styles.statNum, styles.statNumDone]}>{streak}</Text>
                <Text style={styles.statUnit}>jour{streak === 1 ? '' : 's'} d'affilée</Text>
              </View>
            )}
            {textBlock}
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    padding: spacing[4],
    borderWidth: 1,
    overflow: 'hidden',
    gap: 2,
  },
  cardUrgent: { borderColor: 'rgba(255,122,107,0.4)' },
  cardDone: { backgroundColor: colors.surface, borderColor: colors.borderSoft },

  cardCalm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(108,79,224,0.16)',
    borderColor: 'rgba(139,114,238,0.4)',
  },
  calmBadge: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },

  stripe: {
    position: 'absolute',
    top: -20,
    right: -30,
    width: 90,
    height: 90,
    backgroundColor: 'rgba(255,122,107,0.12)',
    transform: [{ rotate: '20deg' }],
  },

  statRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 },
  statNum: { fontFamily: fontFamily.displayBold, fontSize: 30, color: colors.coral, lineHeight: 32 },
  statNumDone: { color: colors.lime },
  statUnit: { fontFamily: fontFamily.textSemiBold, fontSize: 13, color: colors.textDim },

  title: { fontFamily: fontFamily.displaySemiBold, fontSize: 15, color: colors.text },
  note: { fontFamily: fontFamily.textRegular, fontSize: 13, color: colors.textDim, marginTop: 2 },
});
