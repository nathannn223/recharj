import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, spacing } from '@/constants/theme';
import type { EngagementFormat } from '@/lib/courses';

type Props = {
  format: Extract<EngagementFormat, { kind: 'slider' }>;
  value: number | null;
  onChange: (value: number) => void;
};

// Controlled (unlike the exercise-step components): the diagnostic score
// feeds personalizeCardOrder() in the parent screen, so it has to bubble up.
export function DiagnosticSlider({ format, value, onChange }: Props) {
  const steps = Array.from({ length: format.max - format.min + 1 }, (_, i) => format.min + i);

  return (
    <View>
      <Text style={styles.question}>{format.question}</Text>
      <View style={styles.track}>
        {steps.map((n) => (
          <Pressable key={n} onPress={() => onChange(n)} style={styles.step} hitSlop={4}>
            <View style={[styles.fill, value !== null && n > value && styles.fillOff]} />
          </Pressable>
        ))}
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>{format.minLabel}</Text>
        {value !== null && <Text style={styles.value}>{value}</Text>}
        <Text style={styles.label}>{format.maxLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  question: { fontFamily: fontFamily.displaySemiBold, fontSize: 20, color: colors.text, lineHeight: 26, marginBottom: spacing[5] },
  track: { flexDirection: 'row', gap: 4, marginBottom: 10 },
  step: { flex: 1, height: 14 },
  fill: { flex: 1, height: '100%', borderRadius: 6, backgroundColor: colors.violetSoft },
  fillOff: { backgroundColor: colors.borderSoft },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontFamily: fontFamily.textMedium, fontSize: 13, color: colors.textFaint },
  value: { fontFamily: fontFamily.textBold, fontSize: 15, color: colors.coral },
});
