// Options for the pre-signup quiz's "what drains you most" question. Doubles
// as real product data: the label is stored on profiles.primary_pain_type,
// and the tags reuse the same courses.tags matching used for Dashboard
// recommendations (see lib/eventTags.ts).
export type PainType = {
  label: string;
  tags: string[];
};

export const PAIN_TYPES: PainType[] = [
  { label: 'Les repas et réunions de famille', tags: ['famille', 'repas'] },
  { label: 'Prendre la parole en groupe', tags: ['groupe', 'conversation'] },
  { label: 'Le small talk au travail', tags: ['travail'] },
  { label: 'Rencontrer de nouvelles personnes', tags: ['conversation', 'debuter'] },
];
