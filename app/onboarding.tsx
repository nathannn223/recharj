import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useOnboarding } from '@/lib/onboarding';
import { readAndClearPendingOnboarding } from '@/lib/pendingOnboarding';
import { supabase } from '@/lib/supabase';

// Not a slideshow anymore — this is a brief transition: apply whatever the
// pre-signup quiz (app/(auth)/index.tsx) collected to the new profile, then
// drop the user straight into the one guaranteed-unlocked course instead of
// an empty Dashboard. Runs once per account, gated by useOnboarding().seen.
export default function OnboardingTransitionScreen() {
  const { session } = useAuth();
  const { markSeen } = useOnboarding();
  const [status, setStatus] = useState('Préparation de ton premier cours…');

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    async function run() {
      const pending = await readAndClearPendingOnboarding();
      if (pending && !cancelled) {
        await supabase
          .from('profiles')
          .update({
            first_name: pending.firstName || null,
            baseline_comfort_score: pending.baselineScore,
            primary_pain_type: pending.painType || null,
          })
          .eq('id', session!.user.id);
      }

      const { data: freeCourse } = await supabase
        .from('courses')
        .select('id')
        .eq('free_tier_included', true)
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      await markSeen();
      router.replace(freeCourse ? `/course/${freeCourse.id}` : '/(tabs)');
    }

    run().catch(() => {
      if (!cancelled) {
        setStatus('Un souci est survenu, direction ton tableau de bord…');
        markSeen().then(() => router.replace('/(tabs)'));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [session, markSeen]);

  return (
    <View style={styles.screen}>
      <ActivityIndicator color={colors.violetSoft} />
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  status: { fontFamily: fontFamily.textMedium, fontSize: 14, color: colors.textDim },
});
