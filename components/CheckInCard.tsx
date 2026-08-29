import { LinearGradient } from 'expo-linear-gradient';
import { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, radii, spacing } from '@/constants/theme';

type CheckIn = { score: number; comment: string | null };

type Props = {
  checkedIn: CheckIn | null;
  streak: number;
  onPress: () => void;
};

// "The streak in play": leads with the number the user has to lose, not a
// neutral question, because loss aversion converts far better than a plain
// prompt ever will (the same mechanic behind Duolingo's and Snapchat's
// streaks) — the point isn't to describe the day, it's to make not tapping
// feel like the wrong choice.
export function CheckInCard({ checkedIn, streak, onPress }: Props) {
  const pending = !checkedIn;
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 4 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();

  const title = pending
    ? streak > 0
      ? 'Ne laisse pas ta série s\'éteindre.'
      : 'Comment s\'est passée ta journée ?'
    : streak > 1
      ? `Série protégée · ${checkedIn.score}/10`
      : `Journée notée · ${checkedIn.score}/10`;

  const note = pending
    ? streak > 0
      ? 'Touche pour la protéger ce soir.'
      : 'Commence ta série aujourd\'hui.'
    : checkedIn.comment || 'Rendez-vous demain.';

  const showStat = streak > 0;

  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={{ transform: [{ scale }] }}>
        {pending ? (
          <LinearGradient
            colors={['rgba(255,122,107,0.16)', 'rgba(232,255,94,0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, styles.cardPending]}
          >
            <View style={styles.stripe} />
            {showStat && (
              <View style={styles.statRow}>
                <Text style={styles.statNum}>{streak}</Text>
                <Text style={styles.statUnit}>jour{streak === 1 ? '' : 's'} d'affilée</Text>
              </View>
            )}
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.note}>{note}</Text>
          </LinearGradient>
        ) : (
          <View style={[styles.card, styles.cardDone]}>
            {showStat && (
              <View style={styles.statRow}>
                <Text style={[styles.statNum, styles.statNumDone]}>{streak}</Text>
                <Text style={styles.statUnit}>jour{streak === 1 ? '' : 's'} d'affilée</Text>
              </View>
            )}
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.note} numberOfLines={2}>
              {note}
            </Text>
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
  cardPending: { borderColor: 'rgba(255,122,107,0.4)' },
  cardDone: { backgroundColor: colors.surface, borderColor: colors.borderSoft },

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
