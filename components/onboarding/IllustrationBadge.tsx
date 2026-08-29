import { StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';

// The one recurring illustration primitive for onboarding: a soft tinted
// circle behind a line icon. Deliberately minimal (no bespoke artwork per
// screen) so every question/affirmation screen gets a consistent visual
// anchor instead of a wall of text, without a large asset-production effort.
export function IllustrationBadge({
  icon,
  accent = colors.violet,
  size = 84,
}: {
  icon: React.ReactNode;
  accent?: string;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `${accent}22`,
          borderColor: `${accent}55`,
        },
      ]}
    >
      {icon}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});
