// Options for the three follow-up questions asked right after the obstacles
// question in the pre-signup quiz. `id` is what's stored on profiles
// (event_frequency, recharge_method, anticipation_style) for future
// personalization, the same way lib/obstacles.ts and lib/painTypes.ts
// already are — display labels are looked up by id through i18next.
export const EVENT_FREQUENCY_IDS: string[] = ['almost_daily', 'weekly', 'monthly', 'rarely'];

export const RECHARGE_IDS: string[] = ['alone_time', 'sleep', 'physical_activity', 'talk_to_someone_close'];

export const ANTICIPATION_IDS: string[] = ['stress_in_advance', 'avoid_thinking_about_it', 'mentally_prepare', 'no_special_feeling'];
