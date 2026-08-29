// Options for the pre-signup quiz's "when is your social battery lowest"
// question. Stored on profiles.low_battery_moment — intended to later drive
// the timing of the reminder notification requested right after this
// question in the onboarding flow (not built yet, see the notification
// permission screen in app/(auth)/index.tsx).
export const MOMENT_OPTIONS: string[] = ['Le matin', "L'après-midi", 'Le soir', 'La nuit'];
