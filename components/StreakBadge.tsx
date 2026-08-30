import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { BoltIcon } from '@/components/icons/Icon';
import { colors, fontFamily, radii } from '@/constants/theme';

type Props = { streak: number; onPress?: () => void };

const HIGH_STREAK_THRESHOLD = 10;

// Replaces a decorative, non-functional icon (a settings gear nobody could
// tap into anything) with something that actually carries information and
// grows with use. Reuses the app's own bolt motif rather than a literal
// flame — "streak = fire" is the familiar cliché, but Recharj's vocabulary
// is charge, not fire, so a bolt is the on-brand translation of the same idea.
export function StreakBadge({ streak, onPress }: Props) {
  const { t } = useTranslation();
  const tier = streak === 0 ? 'zero' : streak >= HIGH_STREAK_THRESHOLD ? 'high' : 'normal';
  const color = tier === 'zero' ? colors.textFaint : tier === 'high' ? colors.lime : colors.coral;

  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tier !== 'high') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [tier, glow]);

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.22] });

  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityLabel={t('common.streakAccessibilityLabel', { count: streak })}>
      <View style={[styles.badge, tier === 'zero' && styles.badgeZero, tier === 'high' && styles.badgeHigh]}>
        {tier === 'high' && <Animated.View pointerEvents="none" style={[styles.flicker, { opacity: glowOpacity }]} />}
        <BoltIcon color={color} size={20} />
        <Text style={[styles.num, { color }]}>{streak}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    overflow: 'hidden',
  },
  badgeZero: { opacity: 0.6 },
  badgeHigh: { borderColor: 'rgba(232,255,94,0.4)' },
  flicker: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.lime },
  num: { fontFamily: fontFamily.displayBold, fontSize: 21 },
});
