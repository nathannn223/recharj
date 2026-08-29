import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { chargeGradient, colors, fontFamily, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useOnboarding } from '@/lib/onboarding';
import { PAIN_TYPES } from '@/lib/painTypes';
import { readAndClearPendingOnboarding } from '@/lib/pendingOnboarding';
import { supabase } from '@/lib/supabase';

const STEP = { THANKS: 0, COURSE: 1 } as const;

// Signup, and the quiz/recap/trial screens that lead to it, all happen
// before an account exists (see app/(auth)/index.tsx). This screen runs
// right after — the account is real now — and has two jobs: match the free
// course to the pain point the user picked and grant it on their profile,
// then hand them a single clean "go" moment into the app. The course is
// named explicitly on its own screen before the actual navigation happens
// (STEP.COURSE) rather than jumping straight there — a silent redirect
// that resolves to nothing visible reads as "nothing happened" when it
// fails, whereas naming the course first makes a successful resolution
// obvious and a failed one diagnosable instead of just quietly landing on
// the dashboard.
export default function OnboardingWelcomeScreen() {
  const { session } = useAuth();
  const { markSeen } = useOnboarding();

  const [step, setStep] = useState<number>(STEP.THANKS);
  const [preparing, setPreparing] = useState(true);
  const [freeCourseId, setFreeCourseId] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    async function prepare() {
      const pending = await readAndClearPendingOnboarding();
      let matchedCourseId: string | null = null;

      if (pending && !cancelled) {
        // The free course this user gets is the one matching the pain point
        // they picked in the quiz, not a single fixed course for everyone.
        const painDef = PAIN_TYPES.find((p) => p.label === pending.painType);
        if (painDef) {
          const { data: matched } = await supabase
            .from('courses')
            .select('id')
            .contains('tags', painDef.tags)
            .order('order_index', { ascending: true })
            .limit(1)
            .maybeSingle();
          matchedCourseId = matched?.id ?? null;
        }

        await supabase
          .from('profiles')
          .update({
            first_name: pending.firstName || null,
            baseline_comfort_score: pending.baselineScore,
            primary_pain_type: pending.painType || null,
            obstacles: pending.obstacles.length > 0 ? pending.obstacles : null,
            event_frequency: pending.eventFrequency || null,
            recharge_method: pending.rechargeMethod || null,
            anticipation_style: pending.anticipationStyle || null,
            free_course_id: matchedCourseId,
          })
          .eq('id', session!.user.id);

        // Best-effort and deliberately separate from the update above:
        // low_battery_moment (migration 012) is a recent column that may
        // not exist yet on every Supabase project. A single combined
        // update fails entirely if any one column is unknown to
        // PostgREST — which previously broke free_course_id along with it
        // and made a genuinely unlocked course look locked. Splitting it
        // out means that failure mode can never take the grant down with it.
        if (pending.lowBatteryMoment) {
          await supabase.from('profiles').update({ low_battery_moment: pending.lowBatteryMoment }).eq('id', session!.user.id);
        }
      }

      let resolvedFreeCourseId = matchedCourseId;
      if (!resolvedFreeCourseId) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('free_course_id')
          .eq('id', session!.user.id)
          .maybeSingle();
        resolvedFreeCourseId = existingProfile?.free_course_id ?? null;
      }
      if (!resolvedFreeCourseId) {
        const { data: fallbackCourse } = await supabase
          .from('courses')
          .select('id')
          .eq('free_tier_included', true)
          .limit(1)
          .maybeSingle();
        resolvedFreeCourseId = fallbackCourse?.id ?? null;
      }

      // Confirm the grant actually landed before promising direct entry
      // into it, and fetch the title in the same pass — the COURSE screen
      // needs it to name the course, and a title that fails to resolve here
      // is itself the signal that the grant isn't real.
      let resolvedTitle: string | null = null;
      if (resolvedFreeCourseId) {
        const { data: resolvedCourse } = await supabase
          .from('courses')
          .select('title, free_tier_included')
          .eq('id', resolvedFreeCourseId)
          .maybeSingle();
        if (!resolvedCourse) {
          resolvedFreeCourseId = null;
        } else if (!resolvedCourse.free_tier_included) {
          const { data: confirmProfile } = await supabase
            .from('profiles')
            .select('free_course_id')
            .eq('id', session!.user.id)
            .maybeSingle();
          if (confirmProfile?.free_course_id !== resolvedFreeCourseId) {
            resolvedFreeCourseId = null;
          } else {
            resolvedTitle = resolvedCourse.title;
          }
        } else {
          resolvedTitle = resolvedCourse.title;
        }
      }

      if (cancelled) return;
      setFreeCourseId(resolvedFreeCourseId);
      setCourseTitle(resolvedTitle);
      setPreparing(false);
    }

    prepare().catch(() => {
      if (!cancelled) setPreparing(false);
    });

    return () => {
      cancelled = true;
    };
  }, [session]);

  // From THANKS: if a course genuinely resolved, show it by name before
  // navigating anywhere; otherwise there's nothing to reveal, so go
  // straight to the dashboard exactly like the explicit skip button does.
  const goNext = async () => {
    if (freeCourseId && courseTitle) {
      setStep(STEP.COURSE);
    } else {
      await markSeen();
      router.replace('/(tabs)');
    }
  };

  const enterCourse = async () => {
    await markSeen();
    router.replace(freeCourseId ? `/course/${freeCourseId}` : '/(tabs)');
  };

  const goToDashboard = async () => {
    await markSeen();
    router.replace('/(tabs)');
  };

  if (preparing) {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]} edges={['top']}>
        <ActivityIndicator color={colors.violetSoft} />
      </SafeAreaView>
    );
  }

  if (step === STEP.COURSE) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={[styles.content, styles.centered]}>
          <Text style={styles.eyebrow}>Ton premier cours</Text>
          <Text style={styles.title}>{courseTitle}</Text>
          <Pressable onPress={enterCourse} style={{ alignSelf: 'stretch', marginTop: spacing[6] }}>
            <LinearGradient colors={chargeGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.startBtn}>
              <Text style={styles.startBtnText}>C'est parti</Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={goToDashboard} style={styles.dashboardBtn}>
            <Text style={styles.dashboardText}>Aller sur le dashboard</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={[styles.content, styles.centered]}>
        <Text style={styles.title}>Merci de nous faire confiance.</Text>
        <Text style={styles.tagline}>Tu peux découvrir ton premier cours dès maintenant.</Text>
        <Pressable onPress={goNext} style={{ alignSelf: 'stretch', marginTop: spacing[6] }}>
          <LinearGradient colors={chargeGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.startBtn}>
            <Text style={styles.startBtnText}>C'est parti !</Text>
          </LinearGradient>
        </Pressable>
        <Pressable onPress={goToDashboard} style={styles.dashboardBtn}>
          <Text style={styles.dashboardText}>Aller sur le dashboard</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  centered: { alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, padding: spacing[6] },

  eyebrow: { fontFamily: fontFamily.textBold, fontSize: 12, color: colors.coral, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
  title: { fontFamily: fontFamily.displayBold, fontSize: 28, color: colors.text, lineHeight: 34, textAlign: 'center', marginTop: spacing[3] },
  tagline: { fontFamily: fontFamily.textRegular, fontSize: 17, color: colors.textDim, lineHeight: 24, textAlign: 'center', marginTop: spacing[3] },

  startBtn: { borderRadius: radii.md, paddingVertical: 17, alignItems: 'center' },
  startBtnText: { fontFamily: fontFamily.textBold, fontSize: 16, color: colors.surfaceScreen, textAlign: 'center' },

  dashboardBtn: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 6, marginTop: spacing[3] },
  dashboardText: { fontFamily: fontFamily.textSemiBold, fontSize: 14, color: colors.textFaint },
});
