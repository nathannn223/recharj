import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CalendarIcon, CloseIcon } from '@/components/icons/Icon';
import { chargeGradient, colors, fontFamily, radii, spacing } from '@/constants/theme';

const EVENT_TYPES = ['Repas de famille', 'Travail', 'Soirée entre amis', 'Rendez-vous', 'Autre'];

export default function AddEventScreen() {
  const [selectedType, setSelectedType] = useState(EVENT_TYPES[0]);
  const [difficulty, setDifficulty] = useState(7);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <Text style={styles.h1}>Nouvel événement</Text>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <CloseIcon color={colors.textDim} size={26} />
          </Pressable>
        </View>

        <View>
          <Text style={styles.sectionLabel}>Type</Text>
          <View style={styles.chipRow}>
            {EVENT_TYPES.map((type) => {
              const selected = type === selectedType;
              return (
                <Pressable key={type} onPress={() => setSelectedType(type)} style={[styles.chip, selected && styles.chipSelected]}>
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{type}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <Text style={styles.sectionLabel}>Date</Text>
          <View style={styles.field}>
            <Text style={styles.fieldText}>Mardi 19 août</Text>
            <CalendarIcon color={colors.textDim} size={20} />
          </View>
        </View>

        <View>
          <View style={styles.row}>
            <Text style={styles.sectionLabel}>Niveau de difficulté ressentie</Text>
            <Text style={styles.diffValue}>{difficulty}/10</Text>
          </View>
          <View style={styles.sliderTrack}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <Pressable key={n} onPress={() => setDifficulty(n)} style={styles.sliderStep} hitSlop={4}>
                <View style={[styles.sliderFill, n > difficulty && styles.sliderFillOff]} />
              </Pressable>
            ))}
          </View>
          <View style={styles.row}>
            <Text style={styles.sliderLabel}>Facile</Text>
            <Text style={styles.sliderLabel}>Éprouvant</Text>
          </View>
          <Text style={styles.helper}>On te proposera un cours adapté si le niveau dépasse 6.</Text>
        </View>

        <Pressable onPress={() => router.back()}>
          <LinearGradient
            colors={chargeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitBtn}
          >
            <Text style={styles.submitText}>Ajouter à mon calendrier</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: spacing[5], paddingTop: spacing[6], gap: spacing[7], paddingBottom: spacing[8] },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  h1: { fontFamily: fontFamily.displaySemiBold, fontSize: 24, color: colors.text },

  sectionLabel: { fontFamily: fontFamily.textBold, fontSize: 13, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: 11, paddingHorizontal: 16 },
  chipSelected: { backgroundColor: colors.violet, borderColor: colors.violet },
  chipText: { fontFamily: fontFamily.textSemiBold, fontSize: 14, color: colors.textDim },
  chipTextSelected: { color: colors.text },

  field: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldText: { fontFamily: fontFamily.textMedium, fontSize: 16, color: colors.text },

  diffValue: { fontFamily: fontFamily.textBold, fontSize: 15, color: colors.coral, marginBottom: 8 },
  sliderTrack: { flexDirection: 'row', gap: 4, marginTop: 8, marginBottom: 10 },
  sliderStep: { flex: 1, height: 14 },
  sliderFill: { flex: 1, height: '100%', borderRadius: 6, backgroundColor: colors.coral },
  sliderFillOff: { backgroundColor: colors.borderSoft },
  sliderLabel: { fontFamily: fontFamily.textMedium, fontSize: 13, color: colors.textFaint },
  helper: { fontFamily: fontFamily.textRegular, fontSize: 14, color: colors.textDim, marginTop: 12, lineHeight: 20 },

  submitBtn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  submitText: { fontFamily: fontFamily.textBold, fontSize: 16, color: colors.surfaceScreen },
});
