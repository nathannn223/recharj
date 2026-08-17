import { LinearGradient } from 'expo-linear-gradient';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DiagnosticSlider } from '@/components/engagement/DiagnosticSlider';
import { DiagnosticSliderDouble } from '@/components/engagement/DiagnosticSliderDouble';
import { FreePlan } from '@/components/engagement/FreePlan';
import { GuidedResponse } from '@/components/engagement/GuidedResponse';
import { McqNuanced } from '@/components/engagement/McqNuanced';
import { PredictThenCompare } from '@/components/engagement/PredictThenCompare';
import { BoltIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/icons/Icon';
import { chargeGradient, colors, fontFamily, radii, spacing } from '@/constants/theme';
import { canAccessCourse, personalizeCardOrder, type CourseRow, type SourceRow } from '@/lib/courses';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const STEP_COUNT = 4; // hook, diagnostic, cards, exercise

export default function CourseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();

  const [course, setCourse] = useState<CourseRow | null>(null);
  const [sources, setSources] = useState<Map<string, SourceRow>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [sliderValue, setSliderValue] = useState<number | null>(null);
  const [sliderDoubleValue, setSliderDoubleValue] = useState<[number | null, number | null]>([null, null]);
  const [exerciseComplete, setExerciseComplete] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data: profile } = await supabase.from('profiles').select('subscription_tier').single();
      const { data: courseRow, error: courseError } = await supabase.from('courses').select('*').eq('id', id).single();

      if (cancelled) return;
      if (courseError || !courseRow) {
        setError(courseError?.message ?? 'Cours introuvable.');
        setLoading(false);
        return;
      }
      const typedCourse = courseRow as CourseRow;

      if (!profile || !canAccessCourse(typedCourse, profile.subscription_tier)) {
        router.replace('/paywall');
        return;
      }

      const sourceIds = Array.from(
        new Set(typedCourse.content.cards.map((c) => c.sourceId).filter((v): v is string => v !== null))
      );
      const { data: sourceRows } = sourceIds.length
        ? await supabase.from('sources').select('id, short_label').in('id', sourceIds)
        : { data: [] as Pick<SourceRow, 'id' | 'short_label'>[] };

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

  const orderedCards = useMemo(() => {
    if (!course) return [];
    return personalizeCardOrder(course.content, sliderValue);
  }, [course, sliderValue]);

  const diagnosticAnswered =
    course?.content.diagnostic.kind === 'slider-double'
      ? sliderDoubleValue[0] !== null && sliderDoubleValue[1] !== null
      : sliderValue !== null;

  const goBack = () => {
    if (step === 2 && cardIndex > 0) {
      setCardIndex((i) => i - 1);
    } else if (step > 0) {
      setStep((s) => s - 1);
    } else {
      router.back();
    }
  };

  const finishCourse = async () => {
    if (session && course) {
      await supabase
        .from('course_progress')
        .upsert({ user_id: session.user.id, course_id: course.id, status: 'completed', current_step: STEP_COUNT - 1 });
    }
    router.back();
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={colors.violetSoft} />
      </View>
    );
  }

  if (error || !course) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.errorText}>{error ?? 'Cours introuvable.'}</Text>
      </View>
    );
  }

  const { content } = course;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <Pressable onPress={goBack} hitSlop={10}>
            <ChevronLeftIcon color={colors.textDim} size={24} />
          </Pressable>
          <Text style={styles.courseTitle} numberOfLines={1}>
            {course.title}
          </Text>
          <View style={styles.stepDots}>
            {Array.from({ length: STEP_COUNT }, (_, i) => (
              <View key={i} style={[styles.stepDot, i < step && styles.stepDotDone, i === step && styles.stepDotActive]} />
            ))}
          </View>
        </View>

        {step === 0 && (
          <View style={styles.card}>
            <View style={styles.accentBolt}>
              <BoltIcon color={colors.surfaceScreen} size={20} />
            </View>
            <Text style={styles.eyebrow}>Mise en situation</Text>
            <Text style={styles.cardTitle}>{content.hook}</Text>
          </View>
        )}

        {step === 1 &&
          (content.diagnostic.kind === 'slider' ? (
            <DiagnosticSlider format={content.diagnostic} value={sliderValue} onChange={setSliderValue} />
          ) : (
            <DiagnosticSliderDouble format={content.diagnostic} value={sliderDoubleValue} onChange={setSliderDoubleValue} />
          ))}

        {step === 2 && orderedCards[cardIndex] && (
          <View style={styles.card}>
            <View style={styles.accentBolt}>
              <BoltIcon color={colors.surfaceScreen} size={20} />
            </View>
            <Text style={styles.eyebrow}>
              Carte {cardIndex + 1}/{orderedCards.length}
            </Text>
            <Text style={styles.cardTitle}>{orderedCards[cardIndex].title}</Text>
            <Text style={styles.cardBody}>{orderedCards[cardIndex].advice}</Text>
            {orderedCards[cardIndex].sourceId && (
              <Link href={`/source/${orderedCards[cardIndex].sourceId}`} asChild>
                <Pressable style={styles.sourceLink}>
                  <Text style={styles.sourceLinkText}>
                    Source : {sources.get(orderedCards[cardIndex].sourceId!)?.short_label ?? '...'}
                  </Text>
                  <ChevronRightIcon color={colors.violetSoft} size={14} />
                </Pressable>
              </Link>
            )}
          </View>
        )}

        {step === 3 && (
          <ExerciseStep format={content.exercise} onComplete={() => setExerciseComplete(true)} />
        )}

        <View style={styles.navRow}>
          {step > 0 && (
            <Pressable style={styles.btnGhost} onPress={goBack}>
              <Text style={styles.btnGhostText}>Précédent</Text>
            </Pressable>
          )}
          <Pressable
            style={{ flex: 1 }}
            disabled={(step === 1 && !diagnosticAnswered) || (step === 3 && !exerciseComplete)}
            onPress={() => {
              if (step === 2 && cardIndex < orderedCards.length - 1) {
                setCardIndex((i) => i + 1);
              } else if (step === 3) {
                finishCourse();
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
                {step === 3 ? 'Terminer le cours' : step === 2 && cardIndex < orderedCards.length - 1 ? 'Suivant' : 'Continuer'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </View>
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
  courseTitle: { flex: 1, fontFamily: fontFamily.textSemiBold, fontSize: 15, color: colors.textDim, textAlign: 'center' },

  stepDots: { flexDirection: 'row', gap: 6 },
  stepDot: { width: 20, height: 5, borderRadius: 3, backgroundColor: colors.border },
  stepDotDone: { backgroundColor: colors.violetSoft },
  stepDotActive: { backgroundColor: colors.lime },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
    padding: spacing[5],
    gap: spacing[3],
    flex: 1,
    justifyContent: 'center',
    minHeight: 240,
  },
  accentBolt: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: fontFamily.textBold, fontSize: 12, color: colors.coral, textTransform: 'uppercase', letterSpacing: 0.8 },
  cardTitle: { fontFamily: fontFamily.displaySemiBold, fontSize: 22, color: colors.text, lineHeight: 28 },
  cardBody: { fontFamily: fontFamily.textRegular, fontSize: 16, color: colors.textDim, lineHeight: 23 },

  sourceLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing[2] },
  sourceLinkText: { fontFamily: fontFamily.textSemiBold, fontSize: 13, color: colors.violetSoft, textDecorationLine: 'underline' },

  navRow: { flexDirection: 'row', gap: spacing[3], marginTop: 'auto' },
  btnGhost: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingVertical: 16, paddingHorizontal: 22, justifyContent: 'center' },
  btnGhostText: { fontFamily: fontFamily.textSemiBold, fontSize: 15, color: colors.textDim },
  btnPrimary: { borderRadius: radii.md, paddingVertical: 16, alignItems: 'center' },
  btnPrimaryText: { fontFamily: fontFamily.textBold, fontSize: 16, color: colors.surfaceScreen },
  btnDisabled: { opacity: 0.4 },
});
