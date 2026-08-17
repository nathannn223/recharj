import { StyleSheet, Text, View } from 'react-native';

import { UserIcon } from '@/components/icons/Icon';
import { colors, fontFamily, spacing } from '@/constants/theme';

export default function ProfileScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.badge}>
        <UserIcon color={colors.violetSoft} size={22} />
      </View>
      <Text style={styles.title}>Profil</Text>
      <Text style={styles.note}>Compte, abonnement et historique arrivent avec l'intégration Supabase.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', padding: spacing[6], gap: spacing[3] },
  badge: { width: 56, height: 56, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderSoft },
  title: { fontFamily: fontFamily.displaySemiBold, fontSize: 19, color: colors.text },
  note: { fontFamily: fontFamily.textRegular, fontSize: 13, color: colors.textDim, textAlign: 'center', maxWidth: 260 },
});
