import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CheckIcon } from '@/components/icons/Icon';
import { colors, fontFamily, radii, spacing } from '@/constants/theme';
import type { EngagementFormat } from '@/lib/courses';

type Props = {
  format: Extract<EngagementFormat, { kind: 'mcq-nuanced' }>;
  onComplete: () => void;
};

// Every option is plausible by design (no distractor, no "wrong" answer
// styling — red/cross were an explicit product no per the implementation
// notes). Picking any option reveals its own feedback text; a lime check
// appears only if that option happens to be the best one, as gentle
// positive reinforcement, never a negative marker on the others.
export function McqNuanced({ format, onComplete }: Props) {
  const [picked, setPicked] = useState<number | null>(null);

  const pick = (i: number) => {
    setPicked(i);
    onComplete();
  };

  return (
    <View>
      <View style={styles.prompt}>
        <Text style={styles.promptText}>{format.prompt}</Text>
      </View>
      <View style={{ gap: spacing[3], marginTop: spacing[4] }}>
        {format.options.map((opt, i) => {
          const selected = picked === i;
          return (
            <Pressable key={i} onPress={() => pick(i)} style={[styles.choice, selected && styles.choiceSelected]}>
              <View style={[styles.bullet, selected && styles.bulletSelected]}>
                {selected && opt.isBest && <CheckIcon color={colors.surfaceScreen} size={12} />}
              </View>
              <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{opt.text}</Text>
            </Pressable>
          );
        })}
      </View>
      {picked !== null && (
        <View style={styles.feedback}>
          <Text style={styles.feedbackText}>{format.options[picked].feedback}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  prompt: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radii.lg, padding: spacing[4] },
  promptText: { fontFamily: fontFamily.textMedium, fontSize: 16, color: colors.textDim, lineHeight: 23 },

  choice: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing[4] },
  choiceSelected: { borderColor: colors.violet, backgroundColor: 'rgba(108,79,224,0.14)' },
  bullet: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  bulletSelected: { borderColor: colors.violet, backgroundColor: colors.violet },
  choiceText: { flex: 1, fontFamily: fontFamily.textMedium, fontSize: 15, color: colors.textDim },
  choiceTextSelected: { color: colors.text },

  feedback: {
    marginTop: spacing[4],
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: radii.md,
    padding: spacing[3],
  },
  feedbackText: { fontFamily: fontFamily.textMedium, fontSize: 14, color: colors.text, lineHeight: 20 },
});
