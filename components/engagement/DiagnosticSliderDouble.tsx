import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, spacing } from '@/constants/theme';
import type { EngagementFormat } from '@/lib/courses';

type Props = {
  format: Extract<EngagementFormat, { kind: 'slider-double' }>;
  value: [number | null, number | null];
  onChange: (value: [number | null, number | null]) => void;
};

const MIN = 1;
const MAX = 10;
const STEPS = Array.from({ length: MAX - MIN + 1 }, (_, i) => MIN + i);

function MiniSlider({ question, value, onChange }: { question: string; value: number | null; onChange: (v: number) => void }) {
  return (
    <View style={{ marginBottom: spacing[5] }}>
      <Text style={styles.question}>{question}</Text>
      <View style={styles.track}>
        {STEPS.map((n) => (
          <Pressable key={n} onPress={() => onChange(n)} style={styles.step} hitSlop={4}>
            <View style={[styles.fill, value !== null && n > value && styles.fillOff]} />
          </Pressable>
        ))}
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>1</Text>
        {value !== null && <Text style={styles.value}>{value}</Text>}
        <Text style={styles.label}>10</Text>
      </View>
    </View>
  );
}

// Course 5's diagnostic: anxiety predicted now, vs. how badly the user
// expects the event to actually go — the gap between the two is what card 1
// reuses. Both scores are answered before either counts toward "complete".
export function DiagnosticSliderDouble({ format, value, onChange }: Props) {
  const [a, b] = value;
  return (
    <View>
      <MiniSlider question={format.questions[0]} value={a} onChange={(v) => onChange([v, b])} />
      <MiniSlider question={format.questions[1]} value={b} onChange={(v) => onChange([a, v])} />
    </View>
  );
}

const styles = StyleSheet.create({
  question: { fontFamily: fontFamily.displaySemiBold, fontSize: 17, color: colors.text, lineHeight: 23, marginBottom: spacing[4] },
  track: { flexDirection: 'row', gap: 4, marginBottom: 10 },
  step: { flex: 1, height: 14 },
  fill: { flex: 1, height: '100%', borderRadius: 6, backgroundColor: colors.violetSoft },
  fillOff: { backgroundColor: colors.borderSoft },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontFamily: fontFamily.textMedium, fontSize: 13, color: colors.textFaint },
  value: { fontFamily: fontFamily.textBold, fontSize: 15, color: colors.coral },
});
