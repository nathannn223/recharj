import { useRef, useState } from 'react';
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BatteryGauge } from '@/components/BatteryGauge';
import { FlipCard } from '@/components/course/FlipCard';
import { colors, fontFamily, spacing } from '@/constants/theme';
import type { CourseCard } from '@/lib/courses';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Matches app/(auth)/index.tsx's own content padding (spacing[6] both
// sides) so each slide lines up exactly like a normal, non-carousel screen.
const SLIDE_WIDTH = SCREEN_WIDTH - spacing[6] * 2;
// Tall enough to fit the flip card on slide 3 (its own fixed 280px height
// plus this slide's title/body above it); the shorter slides just center
// within the same height instead of each page having its own size.
const CAROUSEL_HEIGHT = 380;

type Slide = { title: string; body: string; illustration: React.ReactNode };

// A real card from the course content, tried hands-on right here instead of
// described — the "aha moment" for the courses half of the app. Uses the
// liking gap (Boothby, Cooney, Sandstrom & Epley, 2018) rather than the
// more familiar mere exposure effect, for a stronger first impression.
const SAMPLE_CARD: CourseCard = {
  title: "L'écart de sympathie",
  advice:
    "Après une conversation, tu penses presque toujours avoir moins plu que la réalité. Des chercheurs ont mesuré cet écart en 2018. Ton interlocuteur t'a sans doute apprécié plus que tu ne le crois.",
  sourceId: null,
};

// Illustrative mockup of a projected week, not real data. Bars trace a
// battery level per day, a dot marks the two days with a hard event.
const WEEK_PREVIEW_DAYS = [
  { label: 'L', level: 82 },
  { label: 'M', level: 88 },
  { label: 'M', level: 55, event: true },
  { label: 'J', level: 40, event: true },
  { label: 'V', level: 62 },
  { label: 'S', level: 95 },
  { label: 'D', level: 100 },
];

function weekBarColor(level: number): string {
  if (level < 50) return colors.coral;
  if (level < 80) return colors.violetSoft;
  return colors.lime;
}

function WeekPreview() {
  return (
    <View style={styles.weekPreview}>
      {WEEK_PREVIEW_DAYS.map((d, i) => (
        <View key={i} style={styles.weekCol}>
          <View style={styles.weekDotSlot}>{d.event && <View style={styles.weekDot} />}</View>
          <View style={styles.weekBarTrack}>
            <View style={[styles.weekBarFill, { height: `${d.level}%`, backgroundColor: weekBarColor(d.level) }]} />
          </View>
          <Text style={styles.weekDayLabel}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

// The app's own battery icon, shown low then high — the exact gauge the
// user will see on their Dashboard, not a generic illustration of one.
function BatteryFlowPreview() {
  return (
    <View style={styles.batteryFlowRow}>
      <BatteryGauge level={28} size="sm" />
      <Text style={styles.batteryFlowArrow}>→</Text>
      <BatteryGauge level={92} size="sm" />
    </View>
  );
}

const SLIDES: Slide[] = [
  { title: 'Ajoute tes événements sociaux.', body: 'On calcule leur impact.', illustration: <WeekPreview /> },
  { title: 'Ta batterie suit tes journées.', body: 'Elle se vide, puis se recharge.', illustration: <BatteryFlowPreview /> },
  {
    title: 'Progresse avec de vrais cours.',
    body: 'Touche la carte pour essayer.',
    // FlipCard sizes its faces absolutely (see components/course/FlipCard),
    // so it needs an ancestor with an explicit width to stretch into —
    // this slide's own alignItems:'center' only hugs intrinsic-width
    // content, which FlipCard's Pressable wrapper doesn't have on its own.
    illustration: (
      <View style={{ width: SLIDE_WIDTH - spacing[4] * 2 }}>
        <FlipCard card={SAMPLE_CARD} index={0} total={1} />
      </View>
    ),
  },
];

export function FeatureCarousel() {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SLIDE_WIDTH);
    if (next !== index) setIndex(next);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={{ width: SLIDE_WIDTH, height: CAROUSEL_HEIGHT }}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { width: SLIDE_WIDTH, height: CAROUSEL_HEIGHT }]}>
            {slide.illustration}
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideBody}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', alignSelf: 'stretch' },
  slide: { alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  slideTitle: { fontFamily: fontFamily.displaySemiBold, fontSize: 22, color: colors.text, textAlign: 'center', lineHeight: 28 },
  slideBody: { fontFamily: fontFamily.textRegular, fontSize: 16, color: colors.textDim, textAlign: 'center' },

  dots: { flexDirection: 'row', justifyContent: 'center', alignSelf: 'center', gap: 8, marginTop: spacing[5] },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.borderSoft },
  dotActive: { backgroundColor: colors.coral, width: 20 },

  weekPreview: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  weekCol: { alignItems: 'center', gap: 6 },
  weekDotSlot: { height: 8, justifyContent: 'center' },
  weekDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.coral },
  weekBarTrack: { width: 12, height: 64, borderRadius: 6, backgroundColor: colors.borderSoft, justifyContent: 'flex-end', overflow: 'hidden' },
  weekBarFill: { width: '100%', borderRadius: 6 },
  weekDayLabel: { fontFamily: fontFamily.textMedium, fontSize: 11, color: colors.textFaint },

  batteryFlowRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  batteryFlowArrow: { fontFamily: fontFamily.textBold, fontSize: 18, color: colors.textFaint },
});
