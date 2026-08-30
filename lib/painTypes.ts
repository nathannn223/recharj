// Options for the pre-signup quiz's "what drains you most" question. Doubles
// as real product data: `id` is what's actually stored on
// profiles.primary_pain_type and matched against courses.tags for Dashboard
// recommendations (see lib/eventTags.ts) — the display label is looked up
// by `id` through i18next (data.painTypes.<id> in locales/*.json) so it
// changes with the app's language without touching what's persisted.
export type PainType = {
  id: string;
  tags: string[];
};

export const PAIN_TYPES: PainType[] = [
  { id: 'family_meals', tags: ['famille', 'repas'] },
  { id: 'group_speaking', tags: ['groupe', 'conversation'] },
  { id: 'work_small_talk', tags: ['travail'] },
  { id: 'meeting_new_people', tags: ['conversation', 'debuter'] },
];
