import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { BoltIcon, ChevronRightIcon } from '@/components/icons/Icon';
import { colors, fontFamily, radii, spacing } from '@/constants/theme';
import type { CourseCard } from '@/lib/courses';

type Props = {
  card: CourseCard;
  index: number;
  total: number;
  sourceLabel?: string;
  onSourcePress?: () => void;
};

// Front shows only the title (like a physical flashcard question side);
// tapping flips it to reveal the advice on the back. Mounted fresh per
// card (parent keys it by index) so it always starts front-side-up.
export function FlipCard({ card, index, total, sourceLabel, onSourcePress }: Props) {
  const { t } = useTranslation();
  const [flipped, setFlipped] = useState(false);
  const flip = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    Animated.spring(flip, {
      toValue: flipped ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
      tension: 10,
    }).start();
    setFlipped(!flipped);
  };

  const frontRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const frontOpacity = flip.interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [1, 1, 0, 0] });
  const backOpacity = flip.interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [0, 0, 1, 1] });

  return (
    <Pressable onPress={toggle} style={styles.wrap}>
      <Animated.View
        style={[
          styles.face,
          styles.front,
          { opacity: frontOpacity, transform: [{ perspective: 1200 }, { rotateY: frontRotate }] },
        ]}
      >
        <View style={styles.accentBolt}>
          <BoltIcon color={colors.surfaceScreen} size={20} />
        </View>
        <Text style={styles.eyebrow}>{t('course.cardLabel', { index: index + 1, total })}</Text>
        <Text style={styles.frontTitle}>{card.title}</Text>
        <Text style={styles.hint}>{t('course.flipHint')}</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.face,
          styles.back,
          { opacity: backOpacity, transform: [{ perspective: 1200 }, { rotateY: backRotate }] },
        ]}
      >
        <Text style={styles.backTitle}>{card.title}</Text>
        <Text style={styles.advice}>{card.advice}</Text>
        {sourceLabel && (
          <Pressable onPress={onSourcePress} style={styles.sourceLink} hitSlop={8}>
            <Text style={styles.sourceLinkText}>{t('course.sourceLabel', { label: sourceLabel })}</Text>
            <ChevronRightIcon color={colors.violetSoft} size={14} />
          </Pressable>
        )}
      </Animated.View>
    </Pressable>
  );
}

const CARD_HEIGHT = 280;

const styles = StyleSheet.create({
  wrap: { height: CARD_HEIGHT },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: CARD_HEIGHT,
    backfaceVisibility: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
    padding: spacing[5],
  },
  front: { alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  back: { justifyContent: 'center', gap: spacing[3] },

  accentBolt: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: fontFamily.textBold, fontSize: 12, color: colors.coral, textTransform: 'uppercase', letterSpacing: 0.8 },
  frontTitle: { fontFamily: fontFamily.displaySemiBold, fontSize: 26, color: colors.text, lineHeight: 32, textAlign: 'center' },
  hint: { fontFamily: fontFamily.textRegular, fontSize: 13, color: colors.textFaint, marginTop: spacing[2] },

  backTitle: { fontFamily: fontFamily.displaySemiBold, fontSize: 19, color: colors.text, lineHeight: 25 },
  advice: { fontFamily: fontFamily.textRegular, fontSize: 18, color: colors.textDim, lineHeight: 26 },

  sourceLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing[1] },
  sourceLinkText: { fontFamily: fontFamily.textSemiBold, fontSize: 13, color: colors.violetSoft, textDecorationLine: 'underline' },
});
