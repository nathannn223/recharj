import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BatteryGauge } from '@/components/BatteryGauge';
import { chargeGradient, colors, fontFamily, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useOnboarding } from '@/lib/onboarding';
import { PAIN_TYPES } from '@/lib/painTypes';
import { readAndClearPendingOnboarding } from '@/lib/pendingOnboarding';
import { supabase } from '@/lib/supabase';

// Signup and onboarding are not the same thing. Signup creates the account;
// onboarding has to show what the product does. The quiz already put the
// flip card mechanic and the battery fill in the user's hands before
// signup, so this screen closes the loop it opened there: it recaps the
// answers the user gave and sends them straight into the course that
// targets their specific pain point.
export default function OnboardingWelcomeScreen() {
  const { session } = useAuth();
  const { markSeen } = useOnboarding();

  const [preparing, setPreparing] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [painType, setPainType] = useState('');
  const [freeCourseId, setFreeCourseId] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    async function prepare() {
      const pending = await readAndClearPendingOnboarding();
      let matchedCourseId: string | null = null;

      if (pending && !cancelled) {
        setFirstName(pending.firstName);
        setScore(pending.baselineScore);
        setPainType(pending.painType);

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

      if (cancelled) return;
      setFreeCourseId(resolvedFreeCourseId);
      setPreparing(false);
    }

    prepare().catch(() => {
      if (!cancelled) setPreparing(false);
    });

    return () => {
      cancelled = true;
    };
  }, [session]);

  const start = async () => {
    await markSeen();
    router.replace(freeCourseId ? `/course/${freeCourseId}` : '/(tabs)');
  };

  const skip = async () => {
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

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.title}>
            {firstName ? `Bienvenue, ${firstName}.` : 'Bienvenue.'} Recharj est calibré pour t'aider au maximum.
          </Text>
        </View>

        <View style={styles.gaugeWrap}>
          <BatteryGauge level={score !== null ? score * 10 : 50} size="lg" />
        </View>

        <Text style={styles.recap}>
          {score !== null && painType
            ? `Tu pars de ${score}/10, et ${painType.toLowerCase()} te coûte le plus d'énergie. Ton premier cours attaque directement ce point.`
            : 'Ton premier cours attend juste en dessous.'}
        </Text>

        <View style={{ gap: spacing[3] }}>
          <Pressable onPress={start}>
            <LinearGradient colors={chargeGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.startBtn}>
              <Text style={styles.startBtnText}>Accéder à mon premier cours</Text>
            </LinearGradient>
          </Pressable>

          <Pressable onPress={skip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Ignorer</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  centered: { alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, padding: spacing[6], paddingTop: spacing[8], justifyContent: 'center', gap: spacing[6] },

  hero: { gap: spacing[2] },
  title: { fontFamily: fontFamily.displayBold, fontSize: 30, color: colors.text, lineHeight: 36 },

  gaugeWrap: { paddingHorizontal: spacing[2] },
  recap: { fontFamily: fontFamily.textRegular, fontSize: 16, color: colors.textDim, lineHeight: 23 },

  startBtn: { borderRadius: radii.md, paddingVertical: 17, alignItems: 'center' },
  startBtnText: { fontFamily: fontFamily.textBold, fontSize: 16, color: colors.surfaceScreen },

  skipBtn: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 6 },
  skipText: { fontFamily: fontFamily.textSemiBold, fontSize: 14, color: colors.textFaint },
});
