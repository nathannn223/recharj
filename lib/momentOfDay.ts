// Options for the pre-signup quiz's "when is your social battery lowest"
// question. `id` is what's stored on profiles.low_battery_moment and what
// lib/notifications.ts keys MOMENT_HOURS on — the display label is looked
// up by id through i18next (data.moments.<id>).
export const MOMENT_IDS: string[] = ['morning', 'afternoon', 'evening', 'night'];
