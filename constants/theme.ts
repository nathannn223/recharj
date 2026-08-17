// Design tokens for Recharj, ported 1:1 from the validated visual identity
// (see brief-projet-app.md and the identity/mockups artifact).

export const colors = {
  ink: '#0F0B1A',
  surface: '#1A1428',
  surfaceRaised: '#221A37',
  surfaceScreen: '#0C0816',
  border: '#31274C',
  borderSoft: '#241C3A',

  text: '#F4F1FC',
  textDim: '#A79AC9',
  textFaint: '#6E6191',

  violet: '#6C4FE0',
  violetDeep: '#4A34A6',
  violetSoft: '#8B72EE',
  coral: '#FF7A6B',
  lime: '#E8FF5E',
  critical: '#FF5C7A',
} as const;

// Horizontal charge gradient: repos -> transition -> pleine charge.
// Always used to represent an actual energy level, never as pure decoration.
// Typed as a fixed 3-tuple so it drops straight into <LinearGradient colors={...}>.
export const chargeGradient: [string, string, string] = [colors.violet, colors.coral, colors.lime];
export const chargeGradientStops = [0, 0.55, 1] as const;

export const radii = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 34,
  pill: 999,
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 24,
  6: 32,
  7: 48,
  8: 64,
} as const;

// Display face (Space Grotesk): titles, CTAs, battery %, course names.
// Body face (Inter): everything else — always in sentence case, never uppercase display.
export const fontFamily = {
  displayMedium: 'SpaceGrotesk_500Medium',
  displaySemiBold: 'SpaceGrotesk_600SemiBold',
  displayBold: 'SpaceGrotesk_700Bold',
  textRegular: 'Inter_400Regular',
  textMedium: 'Inter_500Medium',
  textSemiBold: 'Inter_600SemiBold',
  textBold: 'Inter_700Bold',
} as const;

export const type = {
  display: { fontSize: 44, lineHeight: 48 },
  h1: { fontSize: 28, lineHeight: 34 },
  h2: { fontSize: 22, lineHeight: 28 },
  h3: { fontSize: 17, lineHeight: 22 },
  body: { fontSize: 16, lineHeight: 24 },
  bodySmall: { fontSize: 13, lineHeight: 19 },
  label: { fontSize: 12, lineHeight: 16, letterSpacing: 1.2 },
} as const;

// Semantic difficulty color for an event, independent of the brand accent.
export function difficultyColor(level: number): string {
  if (level >= 7) return colors.coral;
  if (level >= 4) return colors.violetSoft;
  return colors.lime;
}
