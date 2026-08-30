import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { StarIcon } from '@/components/icons/Icon';
import { colors, fontFamily, radii, spacing } from '@/constants/theme';

type Props = {
  onRate: (rating: number) => void;
  onDone: () => void;
};

// Shown once the exercise step is done. Rating is a single tap on a star —
// deliberately no form, no required step, so asking after every course
// stays low-friction instead of causing rating fatigue.
export function CourseComplete({ onRate, onDone }: Props) {
  const { t } = useTranslation();
  const [rating, setRating] = useState<number | null>(null);
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5, tension: 60 }).start();
  }, [scale]);

  const pick = (n: number) => {
    setRating(n);
    onRate(n);
  };

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.badge, { transform: [{ scale }] }]}>
        <StarIcon color={colors.surfaceScreen} size={30} />
      </Animated.View>
      <Text style={styles.title}>{t('course.completed.title')}</Text>
      <Text style={styles.subtitle}>{t('course.completed.subtitle')}</Text>

      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => pick(n)} hitSlop={8}>
            <StarIcon color={rating !== null && n <= rating ? colors.lime : colors.border} size={30} />
          </Pressable>
        ))}
      </View>
      <Text style={styles.starLabel}>{rating ? t('course.completed.thanks') : t('course.completed.askRating')}</Text>

      <Pressable style={styles.doneBtn} onPress={onDone}>
        <Text style={styles.doneBtnText}>{rating ? t('course.completed.finishRated') : t('course.completed.finishSkip')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing[2] },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  title: { fontFamily: fontFamily.displayBold, fontSize: 26, color: colors.text },
  subtitle: { fontFamily: fontFamily.textRegular, fontSize: 15, color: colors.textDim, textAlign: 'center', marginTop: 2 },

  stars: { flexDirection: 'row', gap: 10, marginTop: spacing[6] },
  starLabel: { fontFamily: fontFamily.textMedium, fontSize: 13, color: colors.textFaint, marginTop: spacing[2] },

  doneBtn: { marginTop: spacing[7], borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingVertical: 14, paddingHorizontal: 28 },
  doneBtnText: { fontFamily: fontFamily.textSemiBold, fontSize: 15, color: colors.textDim },
});
