import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { BoltIcon, BookIcon, CalendarIcon } from '@/components/icons/Icon';
import { chargeGradient, colors, fontFamily, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { useOnboarding } from '@/lib/onboarding';
import { readAndClearPendingOnboarding } from '@/lib/pendingOnboarding';
import { supabase } from '@/lib/supabase';

// Research note (see conversation): signup and onboarding are not the same
// thing — signup creates the account, onboarding has to actually show what
// the product does. A silent auto-redirect straight into a course (the
// previous version of this screen) skipped that entirely. But a forced
// multi-step tour is worse — 78% of users abandon those, and tours past
// ~5 steps lose most of what's left. So: exactly one screen, 3 highlights
// max, and the user taps through on their own rather than being redirected.
type Highlight = { icon: React.ReactNode; title: string; body: string };

const HIGHLIGHTS: Highlight[] = [
  {
    icon: <BoltIcon color={colors.surfaceScreen} size={20} />,
    title: 'Ta batterie sociale',
    body: 'Une jauge qui monte et descend selon tes événements — tu vois venir la fatigue avant qu\'elle arrive.',
  },
  {
    icon: <CalendarIcon color={colors.surfaceScreen} size={20} />,
    title: 'Une projection sur tes événements',
    body: "Ajoute un événement et sa difficulté, Recharj calcule l'impact sur les jours suivants.",
  },
  {
    icon: <BookIcon color={colors.surfaceScreen} size={20} />,
    title: 'Des cours en cartes à retourner',
    body: 'Chaque carte cache un conseil sourcé par de vraies études — touche-la pour la retourner.',
  },
];

export default function OnboardingWelcomeScreen() {
  const { session } = useAuth();
  const { markSeen } = useOnboarding();

  const [preparing, setPreparing] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [freeCourseId, setFreeCourseId] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    async function prepare() {
      const pending = await readAndClearPendingOnboarding();
      if (pending && !cancelled) {
        setFirstName(pending.firstName);
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
      setFreeCourseId(freeCourse?.id ?? null);
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

  if (preparing) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={colors.violetSoft} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.title}>{firstName ? `Bienvenue, ${firstName} !` : 'Bienvenue !'}</Text>
          <Text style={styles.subtitle}>Voici comment Recharj va t'aider, en trois choses simples :</Text>
        </View>

        <View style={styles.list}>
          {HIGHLIGHTS.map((h) => (
            <View key={h.title} style={styles.row}>
              <View style={styles.iconBadge}>{h.icon}</View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{h.title}</Text>
                <Text style={styles.rowBody}>{h.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable onPress={start}>
          <LinearGradient colors={chargeGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.startBtn}>
            <Text style={styles.startBtnText}>Commencer mon premier cours</Text>
          </LinearGradient>
        </Pressable>

        {__DEV__ && (
          <Pressable onPress={() => markSeen().then(() => router.replace('/(tabs)'))} style={styles.devBtn}>
            <Text style={styles.devBtnText}>⚡ DEV — Passer, aller au tableau de bord</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  centered: { alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, padding: spacing[6], paddingTop: spacing[8], justifyContent: 'center', gap: spacing[7] },

  hero: { gap: spacing[2] },
  title: { fontFamily: fontFamily.displayBold, fontSize: 28, color: colors.text, lineHeight: 34 },
  subtitle: { fontFamily: fontFamily.textRegular, fontSize: 16, color: colors.textDim, lineHeight: 22 },

  list: { gap: spacing[5] },
  row: { flexDirection: 'row', gap: spacing[3], alignItems: 'flex-start' },
  iconBadge: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: fontFamily.displaySemiBold, fontSize: 16, color: colors.text },
  rowBody: { fontFamily: fontFamily.textRegular, fontSize: 14, color: colors.textDim, marginTop: 2, lineHeight: 20 },

  startBtn: { borderRadius: radii.md, paddingVertical: 17, alignItems: 'center' },
  startBtnText: { fontFamily: fontFamily.textBold, fontSize: 16, color: colors.surfaceScreen },

  devBtn: {
    alignSelf: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.critical,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  devBtnText: { fontFamily: fontFamily.textSemiBold, fontSize: 12, color: colors.critical },
});
