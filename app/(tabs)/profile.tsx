import { Pressable, StyleSheet, Text, View } from 'react-native';

import { UserIcon } from '@/components/icons/Icon';
import { colors, fontFamily, radii, spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();

  return (
    <View style={styles.screen}>
      <View style={styles.badge}>
        <UserIcon color={colors.violetSoft} size={32} />
      </View>
      <Text style={styles.title}>Profil</Text>
      <Text style={styles.email}>{session?.user.email}</Text>
      <Text style={styles.note}>Abonnement et historique arrivent avec la suite de l'intégration Supabase.</Text>

      <Pressable style={styles.signOutBtn} onPress={signOut}>
        <Text style={styles.signOutText}>Se déconnecter</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', padding: spacing[6], gap: spacing[3] },
  badge: { width: 76, height: 76, borderRadius: 24, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderSoft },
  title: { fontFamily: fontFamily.displaySemiBold, fontSize: 26, color: colors.text },
  email: { fontFamily: fontFamily.textMedium, fontSize: 14, color: colors.textDim },
  note: { fontFamily: fontFamily.textRegular, fontSize: 16, color: colors.textDim, textAlign: 'center', maxWidth: 280, marginTop: spacing[2] },
  signOutBtn: {
    marginTop: spacing[6],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  signOutText: { fontFamily: fontFamily.textSemiBold, fontSize: 14, color: colors.critical },
});
