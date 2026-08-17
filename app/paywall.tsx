import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CheckIcon, CloseIcon } from '@/components/icons/Icon';
import { chargeGradient, colors, fontFamily, radii, spacing } from '@/constants/theme';
import { safeBack } from '@/lib/navigation';

type Tier = {
  id: 'free' | 'intermediate' | 'superior';
  name: string;
  price: string;
  perks: string[];
  highlight?: boolean;
};

const TIERS: Tier[] = [
  {
    id: 'free',
    name: 'Gratuit',
    price: '0€ / mois',
    perks: ['Projection illimitée', '1 cours en illimité'],
  },
  {
    id: 'intermediate',
    name: 'Intermédiaire',
    price: '~5€ / mois',
    perks: ['Bibliothèque complète', 'Projection limitée'],
    highlight: true,
  },
  {
    id: 'superior',
    name: 'Supérieur',
    price: '~10€ / mois',
    perks: ['Historique & patterns', 'Recommandations prioritaires'],
  },
];

export default function PaywallScreen() {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <Text style={styles.h1}>Choisis ton palier</Text>
          <Pressable onPress={() => safeBack()} hitSlop={10}>
            <CloseIcon color={colors.textDim} size={26} />
          </Pressable>
        </View>

        <View style={{ gap: spacing[4] }}>
          {TIERS.map((tier) => (
            <View key={tier.id} style={[styles.tierCard, tier.highlight && styles.tierCardHighlight]}>
              {tier.highlight && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Populaire</Text>
                </View>
              )}
              <Text style={styles.tierName}>{tier.name}</Text>
              <Text style={styles.tierPrice}>{tier.price}</Text>
              <View style={{ gap: 6, marginTop: spacing[2] }}>
                {tier.perks.map((perk) => (
                  <View key={perk} style={styles.perkRow}>
                    <CheckIcon color={colors.lime} size={14} />
                    <Text style={styles.perkText}>{perk}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={{ gap: spacing[3], marginTop: 'auto' }}>
          <Pressable onPress={() => safeBack()}>
            <LinearGradient colors={chargeGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtn}>
              <Text style={styles.submitText}>Continuer avec Intermédiaire</Text>
            </LinearGradient>
          </Pressable>
          <Text style={styles.footnote}>Annulable à tout moment</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: spacing[5], paddingTop: spacing[6], gap: spacing[6], paddingBottom: spacing[8], flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h1: { fontFamily: fontFamily.displaySemiBold, fontSize: 24, color: colors.text },

  tierCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing[4],
    gap: 4,
    position: 'relative',
  },
  tierCardHighlight: {
    borderWidth: 1.5,
    borderColor: colors.coral,
    backgroundColor: 'rgba(255,122,107,0.06)',
  },
  badge: {
    position: 'absolute',
    top: -12,
    right: 16,
    backgroundColor: colors.coral,
    borderRadius: radii.pill,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  badgeText: { fontFamily: fontFamily.textBold, fontSize: 11, color: colors.surfaceScreen, letterSpacing: 0.4 },
  tierName: { fontFamily: fontFamily.textBold, fontSize: 16, color: colors.text },
  tierPrice: { fontFamily: fontFamily.displaySemiBold, fontSize: 22, color: colors.text },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  perkText: { fontFamily: fontFamily.textRegular, fontSize: 14, color: colors.textDim },

  submitBtn: { borderRadius: radii.md, paddingVertical: 18, alignItems: 'center' },
  submitText: { fontFamily: fontFamily.textBold, fontSize: 16, color: colors.surfaceScreen },
  footnote: { fontFamily: fontFamily.textRegular, fontSize: 12, color: colors.textFaint, textAlign: 'center' },
});
