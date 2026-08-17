import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ChevronRightIcon, UserIcon } from '@/components/icons/Icon';
import { colors, fontFamily, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import type { SubscriptionTier } from '@/lib/courses';
import { supabase } from '@/lib/supabase';

const TIER_LABEL: Record<SubscriptionTier, string> = {
  free: 'Gratuit',
  intermediate: 'Intermédiaire',
  superior: 'Supérieur',
};

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier | null>(null);
  const [completedCount, setCompletedCount] = useState<number | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    Promise.all([
      supabase.from('profiles').select('subscription_tier').single(),
      supabase.from('course_progress').select('course_id', { count: 'exact', head: true }).eq('status', 'completed'),
    ]).then(([{ data: profile }, { count }]) => {
      if (cancelled) return;
      setTier((profile?.subscription_tier as SubscriptionTier) ?? 'free');
      setCompletedCount(count ?? 0);
    });

    return () => {
      cancelled = true;
    };
  }, [session]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <UserIcon color={colors.violetSoft} size={32} />
          </View>
          <Text style={styles.title}>Profil</Text>
          <Text style={styles.email}>{session?.user.email}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{completedCount ?? '—'}</Text>
            <Text style={styles.statLabel}>Cours terminés</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{tier ? TIER_LABEL[tier] : '—'}</Text>
            <Text style={styles.statLabel}>Palier actuel</Text>
          </View>
        </View>

        <Pressable style={styles.row} onPress={() => router.push('/paywall')}>
          <Text style={styles.rowText}>Gérer mon abonnement</Text>
          <ChevronRightIcon color={colors.textDim} size={18} />
        </Pressable>

        <Pressable style={styles.signOutBtn} onPress={signOut}>
          <Text style={styles.signOutText}>Se déconnecter</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: spacing[5], paddingTop: spacing[7], gap: spacing[6], alignItems: 'center' },

  header: { alignItems: 'center', gap: spacing[2] },
  badge: { width: 76, height: 76, borderRadius: 24, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderSoft },
  title: { fontFamily: fontFamily.displaySemiBold, fontSize: 24, color: colors.text, marginTop: spacing[2] },
  email: { fontFamily: fontFamily.textMedium, fontSize: 14, color: colors.textDim },

  statsRow: { flexDirection: 'row', gap: spacing[3], width: '100%' },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
    padding: spacing[4],
    alignItems: 'center',
    gap: 4,
  },
  statValue: { fontFamily: fontFamily.displaySemiBold, fontSize: 20, color: colors.text },
  statLabel: { fontFamily: fontFamily.textRegular, fontSize: 12, color: colors.textDim, textAlign: 'center' },

  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
    padding: spacing[4],
  },
  rowText: { fontFamily: fontFamily.textSemiBold, fontSize: 15, color: colors.text },

  signOutBtn: {
    marginTop: spacing[4],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  signOutText: { fontFamily: fontFamily.textSemiBold, fontSize: 14, color: colors.critical },
});
