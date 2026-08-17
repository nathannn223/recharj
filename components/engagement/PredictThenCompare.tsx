import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fontFamily, radii, spacing } from '@/constants/theme';
import type { EngagementFormat } from '@/lib/courses';

type Props = {
  format: Extract<EngagementFormat, { kind: 'predict-compare' }>;
  onComplete: () => void;
};

// Self-explanation effect (Chi et al., 1994): the user produces their own
// answer first, and only sees the app's examples after — not before, and
// not instead of. The typed answer itself isn't persisted anywhere; only
// the act of comparing matters for course progress.
export function PredictThenCompare({ format, onComplete }: Props) {
  const [answer, setAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);

  const reveal = () => {
    setRevealed(true);
    onComplete();
  };

  return (
    <View>
      <View style={styles.prompt}>
        <Text style={styles.promptText}>{format.prompt}</Text>
      </View>
      <TextInput
        value={answer}
        onChangeText={setAnswer}
        placeholder="Écris ta réponse…"
        placeholderTextColor={colors.textFaint}
        multiline
        style={styles.input}
      />
      {!revealed ? (
        <Pressable disabled={!answer.trim()} onPress={reveal} style={[styles.compareBtn, !answer.trim() && styles.compareBtnDisabled]}>
          <Text style={styles.compareBtnText}>Comparer avec des exemples</Text>
        </Pressable>
      ) : (
        <View style={styles.examples}>
          <Text style={styles.examplesLabel}>Quelques exemples</Text>
          {format.examples.map((ex, i) => (
            <View key={i} style={styles.exampleRow}>
              <Text style={styles.exampleText}>{ex}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  prompt: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radii.lg, padding: spacing[4] },
  promptText: { fontFamily: fontFamily.textMedium, fontSize: 16, color: colors.textDim, lineHeight: 23 },

  input: {
    marginTop: spacing[4],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    padding: spacing[4],
    minHeight: 90,
    textAlignVertical: 'top',
    fontFamily: fontFamily.textMedium,
    fontSize: 15,
    color: colors.text,
  },

  compareBtn: { marginTop: spacing[3], borderWidth: 1, borderColor: colors.violetSoft, borderRadius: radii.md, paddingVertical: 13, alignItems: 'center' },
  compareBtnDisabled: { opacity: 0.4 },
  compareBtnText: { fontFamily: fontFamily.textSemiBold, fontSize: 14, color: colors.violetSoft },

  examples: { marginTop: spacing[4], gap: spacing[2] },
  examplesLabel: { fontFamily: fontFamily.textBold, fontSize: 12, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  exampleRow: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radii.md, padding: spacing[3] },
  exampleText: { fontFamily: fontFamily.textRegular, fontSize: 14, color: colors.textDim, lineHeight: 20 },
});
