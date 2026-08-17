import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CalendarIcon, CloseIcon } from '@/components/icons/Icon';
import { chargeGradient, colors, fontFamily, radii, spacing } from '@/constants/theme';
import { useEvents } from '@/hooks/useEvents';
import { toDateKey } from '@/lib/battery';
import { safeBack } from '@/lib/navigation';

const EVENT_TYPES = ['Repas de famille', 'Travail', 'Soirée entre amis', 'Rendez-vous', 'Autre'];

function formatFrenchDate(date: Date): string {
  const formatted = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export default function AddEventScreen() {
  const { addEvent } = useEvents();
  const [selectedType, setSelectedType] = useState(EVENT_TYPES[0]);
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [difficulty, setDifficulty] = useState(7);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    const { error: submitError } = await addEvent({
      type: selectedType,
      eventDate: toDateKey(date),
      difficulty,
    });
    setSubmitting(false);
    if (submitError) {
      setError(submitError);
    } else {
      safeBack();
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <Text style={styles.h1}>Nouvel événement</Text>
          <Pressable onPress={() => safeBack()} hitSlop={10}>
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
          <Pressable style={styles.field} onPress={() => setShowPicker((v) => !v)}>
            <Text style={styles.fieldText}>{formatFrenchDate(date)}</Text>
            <CalendarIcon color={colors.textDim} size={20} />
          </Pressable>
          {showPicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowPicker(Platform.OS === 'ios');
                if (event.type === 'set' && selectedDate) setDate(selectedDate);
              }}
            />
          )}
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

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable onPress={submit} disabled={submitting}>
          <LinearGradient
            colors={chargeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          >
            <Text style={styles.submitText}>{submitting ? 'Ajout en cours…' : 'Ajouter à mon calendrier'}</Text>
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

  error: { fontFamily: fontFamily.textMedium, fontSize: 13, color: colors.critical },

  submitBtn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  submitText: { fontFamily: fontFamily.textBold, fontSize: 16, color: colors.surfaceScreen },
});
