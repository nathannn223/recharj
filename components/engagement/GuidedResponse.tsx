import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fontFamily, radii, spacing } from '@/constants/theme';
import type { EngagementFormat } from '@/lib/courses';

type Props = {
  format: Extract<EngagementFormat, { kind: 'guided-response' }>;
  onComplete: () => void;
};

// Two sequential free-text zones (thought -> reformulation, or facts vs.
// interpretation) — no right/wrong answer, so no reveal/compare step.
export function GuidedResponse({ format, onComplete }: Props) {
  const [first, setFirst] = useState('');
  const [stage, setStage] = useState<1 | 2>(1);
  const [second, setSecond] = useState('');

  const advance = () => setStage(2);
  const onSecondChange = (text: string) => {
    setSecond(text);
    if (text.trim()) onComplete();
  };

  return (
    <View>
      <View style={styles.prompt}>
        <Text style={styles.promptText}>{format.prompt}</Text>
      </View>
      <TextInput
        value={first}
        onChangeText={setFirst}
        placeholder="Écris ici…"
        placeholderTextColor={colors.textFaint}
        multiline
        editable={stage === 1}
        style={styles.input}
      />
      {stage === 1 ? (
        <Pressable disabled={!first.trim()} onPress={advance} style={[styles.nextBtn, !first.trim() && styles.nextBtnDisabled]}>
          <Text style={styles.nextBtnText}>Continuer</Text>
        </Pressable>
      ) : (
        <>
          <View style={styles.prompt}>
            <Text style={styles.promptText}>{format.followUp}</Text>
          </View>
          <TextInput
            value={second}
            onChangeText={onSecondChange}
            placeholder="Écris ici…"
            placeholderTextColor={colors.textFaint}
            multiline
            style={styles.input}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  prompt: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.lg,
    padding: spacing[4],
    marginTop: spacing[4],
  },
  promptText: { fontFamily: fontFamily.textMedium, fontSize: 16, color: colors.textDim, lineHeight: 23 },

  input: {
    marginTop: spacing[3],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    padding: spacing[4],
    minHeight: 80,
    textAlignVertical: 'top',
    fontFamily: fontFamily.textMedium,
    fontSize: 15,
    color: colors.text,
  },

  nextBtn: { marginTop: spacing[3], borderWidth: 1, borderColor: colors.violetSoft, borderRadius: radii.md, paddingVertical: 13, alignItems: 'center' },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { fontFamily: fontFamily.textSemiBold, fontSize: 14, color: colors.violetSoft },
});
