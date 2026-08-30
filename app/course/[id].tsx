import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CourseComplete } from '@/components/course/CourseComplete';
import { FlipCard } from '@/components/course/FlipCard';
import { DiagnosticSlider } from '@/components/engagement/DiagnosticSlider';
import { DiagnosticSliderDouble } from '@/components/engagement/DiagnosticSliderDouble';
import { FreePlan } from '@/components/engagement/FreePlan';
import { GuidedResponse } from '@/components/engagement/GuidedResponse';
import { McqNuanced } from '@/components/engagement/McqNuanced';
import { PredictThenCompare } from '@/components/engagement/PredictThenCompare';
import { BoltIcon, ChevronLeftIcon } from '@/components/icons/Icon';
import { chargeGradient, colors, fontFamily, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import {
  canAccessCourse,
  localizedCourseContent,
  localizedCourseTitle,
  personalizeCardOrder,
  type CourseRow,
  type SourceRow,
} from '@/lib/courses';
import { safeBack } from '@/lib/navigation';
import { supabase } from '@/lib/supabase';

const STEP_COUNT = 4; // hook, diagnostic, cards, exercise

export default function CourseScreen() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();

  const [course, setCourse] = useState<CourseRow | null>(null);
  const [sources, setSources] = useState<Map<string, SourceRow>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState(0);
  const [cardIndex, setCardIndex] = useState(-1); // -1 = "here's what's coming" intro card
  const [sliderValue, setSliderValue] = useState<number | null>(null);
  const [sliderDoubleValue, setSliderDoubleValue] = useState<[number | null, number | null]>([null, null]);
  const [exerciseComplete, setExerciseComplete] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: tierRow } = await supabase.from('profiles').select('subscription_tier').single();
      const { data: courseRow, error: courseError } = await supabase.from('courses').select('*').eq('id', id).single();

      if (cancelled) return;
      if (courseError || !courseRow) {
        setError(courseError?.message ?? t('course.notFound'));
        setLoading(false);
        return;
      }
      const typedCourse = courseRow as CourseRow;

      // Fetched separately and treated as best-effort: this column is a
      // recent addition, and a user whose account predates it (or whose
      // Supabase project is missing the migration) should still be able to
      // access whichever course is genuinely free_tier_included — that
      // check must not depend on this one succeeding.
      const { data: freeCourseRow } = await supabase.from('profiles').select('free_course_id').maybeSingle();

      if (!tierRow || !canAccessCourse(typedCourse, tierRow.subscription_tier, freeCourseRow?.free_course_id ?? null)) {
        router.replace({ pathname: '/paywall', params: { courseId: id } });
        return;
      }

      const sourceIds = Array.from(
        new Set(
          [...typedCourse.content.cards, ...typedCourse.content_en.cards]
            .map((c) => c.sourceId)
            .filter((v): v is string => v !== null)
        )
      );
      const { data: sourceRows } = sourceIds.length
        ? await supabase.from('sources').select('id, short_label, short_label_en').in('id', sourceIds)
        : { data: [] as Pick<SourceRow, 'id' | 'short_label' | 'short_label_en'>[] };

      if (cancelled) return;
      setCourse(typedCourse);
      setSources(new Map((sourceRows ?? []).map((s) => [s.id, s as SourceRow])));
      setLoading(false);

      // Mark the course as started, unless it's already been completed before.
      if (session) {
        const { data: progress } = await supabase
          .from('course_progress')
          .select('status')
          .eq('course_id', id)
          .maybeSingle();
        if (progress?.status !== 'completed') {
          await supabase
            .from('course_progress')
            .upsert({ user_id: session.user.id, course_id: id, status: 'in_progress', current_step: 0 });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, session]);

  const content = useMemo(() => (course ? localizedCourseContent(course, i18n.language) : null), [course, i18n.language]);

  const orderedCards = useMemo(() => {
    if (!content) return [];
    return personalizeCardOrder(content, sliderValue);
  }, [content, sliderValue]);

  const diagnosticAnswered =
    content?.diagnostic.kind === 'slider-double'
      ? sliderDoubleValue[0] !== null && sliderDoubleValue[1] !== null
      : sliderValue !== null;

  const goBack = () => {
    if (step === 2 && cardIndex > -1) {
      setCardIndex((i) => i - 1);
    } else if (step > 0) {
      setStep((s) => s - 1);
    } else {
      safeBack();
    }
  };

  const markCompleted = async () => {
    if (session && course) {
      await supabase
        .from('course_progress')
        .upsert({ user_id: session.user.id, course_id: course.id, status: 'completed', current_step: STEP_COUNT - 1 });
    }
    setFinished(true);
  };

  const rateCourse = async (rating: number) => {
    if (session && course) {
      await supabase.from('course_progress').update({ rating }).eq('user_id', session.user.id).eq('course_id', course.id);
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={colors.violetSoft} />
      </View>
    );
  }

  if (error || !course || !content) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.errorText}>{error ?? t('course.notFound')}</Text>
      </View>
    );
  }

  if (finished) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={[styles.content, styles.centered, { flex: 1 }]}>
          <CourseComplete onRate={rateCourse} onDone={() => safeBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <Pressable onPress={goBack} hitSlop={10}>
            <ChevronLeftIcon color={colors.textDim} size={24} />
          </Pressable>
          <Text style={styles.courseTitle} numberOfLines={1}>
            {localizedCourseTitle(course, i18n.language)}
          </Text>
          <View style={styles.stepDots}>
            {Array.from({ length: STEP_COUNT }, (_, i) => (
              <View key={i} style={[styles.stepDot, i < step && styles.stepDotDone, i === step && styles.stepDotActive]} />
            ))}
          </View>
        </View>

        <View style={styles.stepBody}>
          {step === 0 && (
            <View style={styles.card}>
              <View style={styles.accentBolt}>
                <BoltIcon color={colors.surfaceScreen} size={20} />
              </View>
              <Text style={styles.eyebrow}>{t('course.hook')}</Text>
              <Text style={styles.cardTitle}>{content.hook}</Text>
            </View>
          )}

          {step === 1 &&
            (content.diagnostic.kind === 'slider' ? (
              <DiagnosticSlider format={content.diagnostic} value={sliderValue} onChange={setSliderValue} />
            ) : (
              <DiagnosticSliderDouble format={content.diagnostic} value={sliderDoubleValue} onChange={setSliderDoubleValue} />
            ))}

          {step === 2 && cardIndex === -1 && (
            <View style={styles.card}>
              <View style={styles.accentBolt}>
                <BoltIcon color={colors.surfaceScreen} size={20} />
              </View>
              <Text style={styles.eyebrow}>{t('course.cardsIntro')}</Text>
              <Text style={styles.cardTitle}>{t('course.cardsIntroTitle', { count: orderedCards.length })}</Text>
            </View>
          )}

          {step === 2 && cardIndex >= 0 && orderedCards[cardIndex] && (
            <FlipCard
              key={cardIndex}
              card={orderedCards[cardIndex]}
              index={cardIndex}
              total={orderedCards.length}
              sourceLabel={
                orderedCards[cardIndex].sourceId
                  ? sources.get(orderedCards[cardIndex].sourceId!)?.[i18n.language === 'fr' ? 'short_label' : 'short_label_en']
                  : undefined
              }
              onSourcePress={() => router.push(`/source/${orderedCards[cardIndex].sourceId}`)}
            />
          )}

          {step === 3 && <ExerciseStep format={content.exercise} onComplete={() => setExerciseComplete(true)} />}
        </View>

        <View style={styles.navRow}>
          {(step > 0 || cardIndex > -1) && (
            <Pressable style={styles.btnGhost} onPress={goBack}>
              <Text style={styles.btnGhostText}>{t('course.previous')}</Text>
            </Pressable>
          )}
          <Pressable
            style={{ flex: 1 }}
            disabled={(step === 1 && !diagnosticAnswered) || (step === 3 && !exerciseComplete)}
            onPress={() => {
              if (step === 2 && cardIndex < orderedCards.length - 1) {
                setCardIndex((i) => i + 1);
              } else if (step === 3) {
                markCompleted();
              } else {
                setStep((s) => s + 1);
              }
            }}
          >
            <LinearGradient
              colors={chargeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.btnPrimary,
                (step === 1 && !diagnosticAnswered) || (step === 3 && !exerciseComplete) ? styles.btnDisabled : null,
              ]}
            >
              <Text style={styles.btnPrimaryText}>
                {step === 3 ? t('course.finish') : step === 2 && cardIndex < orderedCards.length - 1 ? t('course.next') : t('course.continue')}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ExerciseStep({ format, onComplete }: { format: CourseRow['content']['exercise']; onComplete: () => void }) {
  switch (format.kind) {
    case 'mcq-nuanced':
      return <McqNuanced format={format} onComplete={onComplete} />;
    case 'predict-compare':
      return <PredictThenCompare format={format} onComplete={onComplete} />;
    case 'guided-response':
      return <GuidedResponse format={format} onComplete={onComplete} />;
    case 'free-plan':
      return <FreePlan format={format} onComplete={onComplete} />;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  centered: { alignItems: 'center', justifyContent: 'center' },
  errorText: { fontFamily: fontFamily.textMedium, fontSize: 14, color: colors.critical, padding: spacing[5], textAlign: 'center' },
  content: { padding: spacing[5], paddingTop: spacing[6], gap: spacing[6], paddingBottom: spacing[8], flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3] },
  courseTitle: { flex: 1, fontFamily: fontFamily.textSemiBold, fontSize: 16, color: colors.textDim, textAlign: 'center' },

  stepDots: { flexDirection: 'row', gap: 6 },
  stepDot: { width: 20, height: 5, borderRadius: 3, backgroundColor: colors.border },
  stepDotDone: { backgroundColor: colors.violetSoft },
  stepDotActive: { backgroundColor: colors.lime },

  // Centers whichever step is active in the space between the header and
  // the nav row, instead of each step sitting at the natural top of the
  // scroll flow (the diagnostic step in particular used to read as stuck
  // under the header).
  stepBody: { flex: 1, justifyContent: 'center' },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
    padding: spacing[5],
    gap: spacing[3],
    minHeight: 280,
    justifyContent: 'center',
  },
  accentBolt: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: fontFamily.textBold, fontSize: 13, color: colors.coral, textTransform: 'uppercase', letterSpacing: 0.8 },
  cardTitle: { fontFamily: fontFamily.displaySemiBold, fontSize: 27, color: colors.text, lineHeight: 34 },

  navRow: { flexDirection: 'row', gap: spacing[3], marginTop: spacing[6] },
  btnGhost: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingVertical: 16, paddingHorizontal: 22, justifyContent: 'center' },
  btnGhostText: { fontFamily: fontFamily.textSemiBold, fontSize: 15, color: colors.textDim },
  btnPrimary: { borderRadius: radii.md, paddingVertical: 16, alignItems: 'center' },
  btnPrimaryText: { fontFamily: fontFamily.textBold, fontSize: 16, color: colors.surfaceScreen },
  btnDisabled: { opacity: 0.4 },
});
