import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BoltIcon, CheckIcon, ChevronRightIcon, LockIcon, SearchIcon } from '@/components/icons/Icon';
import { chargeGradient, colors, fontFamily, radii, spacing } from '@/constants/theme';

const FILTERS = ['Tous', 'Débuter', 'Travail', 'Famille'];

type Course = {
  id: string;
  name: string;
  meta: string;
  status: 'done' | 'progress' | 'locked';
  progress?: string;
};

const courses: Course[] = [
  { id: '1', name: 'Démarrer une conversation', meta: '4 min · Terminé', status: 'done' },
  { id: '2', name: 'Gérer un silence gênant', meta: '5 min · En cours', status: 'progress', progress: '60%' },
  { id: '3', name: "Sortir poliment d'une conversation", meta: 'Palier intermédiaire', status: 'locked' },
  { id: '4', name: 'Récupérer son énergie après un événement', meta: 'Palier intermédiaire', status: 'locked' },
  { id: '5', name: "Gérer l'anxiété avant un événement", meta: 'Palier intermédiaire', status: 'locked' },
];

export default function LibraryScreen() {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <Text style={styles.h1}>Bibliothèque</Text>
          <SearchIcon color={colors.textDim} size={18} />
        </View>

        <View style={styles.chipRow}>
          {FILTERS.map((f, i) => (
            <View key={f} style={[styles.chip, i === 0 && styles.chipSelected]}>
              <Text style={[styles.chipText, i === 0 && styles.chipTextSelected]}>{f}</Text>
            </View>
          ))}
        </View>

        <View style={{ gap: spacing[2] }}>
          {courses.map((c) => (
            <View key={c.id} style={[styles.libRow, c.status === 'locked' && styles.libRowLocked]}>
              <View style={styles.libIcon}>
                {c.status === 'done' && <CheckIcon color={colors.violetSoft} size={14} />}
                {c.status === 'progress' && <BoltIcon color={colors.violetSoft} size={14} />}
                {c.status === 'locked' && <LockIcon color={colors.violetSoft} size={14} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.libName}>{c.name}</Text>
                <Text style={styles.libMeta}>{c.meta}</Text>
              </View>
              {c.status === 'done' && <Text style={{ color: colors.lime, fontFamily: fontFamily.textBold, fontSize: 12 }}>✓</Text>}
              {c.status === 'progress' && <Text style={{ color: colors.coral, fontFamily: fontFamily.textBold, fontSize: 11 }}>{c.progress}</Text>}
            </View>
          ))}
        </View>

        <Pressable>
          <LinearGradient colors={chargeGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.upgradeBanner}>
            <View>
              <Text style={styles.upgradeTitle}>Débloque les 10 cours</Text>
              <Text style={styles.upgradeSub}>À partir de ~5€/mois</Text>
            </View>
            <ChevronRightIcon color={colors.surfaceScreen} size={16} />
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: spacing[4], paddingTop: spacing[6], gap: spacing[5], paddingBottom: spacing[8] },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h1: { fontFamily: fontFamily.displaySemiBold, fontSize: 22, color: colors.text },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: 8, paddingHorizontal: 12 },
  chipSelected: { backgroundColor: colors.violet, borderColor: colors.violet },
  chipText: { fontFamily: fontFamily.textSemiBold, fontSize: 11, color: colors.textDim },
  chipTextSelected: { color: colors.text },

  libRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    padding: spacing[3],
  },
  libRowLocked: { opacity: 0.55 },
  libIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  libName: { fontFamily: fontFamily.textSemiBold, fontSize: 12.5, color: colors.text },
  libMeta: { fontFamily: fontFamily.textRegular, fontSize: 10.5, color: colors.textDim, marginTop: 1 },

  upgradeBanner: { borderRadius: 14, padding: spacing[3], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  upgradeTitle: { fontFamily: fontFamily.textBold, fontSize: 12.5, color: colors.surfaceScreen },
  upgradeSub: { fontFamily: fontFamily.textRegular, fontSize: 10.5, color: colors.surfaceScreen, opacity: 0.75, marginTop: 1 },
});
