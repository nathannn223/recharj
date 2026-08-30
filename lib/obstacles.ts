// Options for the pre-signup quiz's "what stops you" question. `id` is what's
// stored on profiles.obstacles (text array); the display label is looked up
// by id through i18next (data.obstacles.<id>) for later use in
// stalled-user re-engagement copy (see the onboarding skill's "Handling
// Stalled Users" section).
export const OBSTACLE_IDS: string[] = ['no_idea_where_to_start', 'lack_of_time', 'too_much_energy', 'guilt_when_it_fails', 'forgets'];
