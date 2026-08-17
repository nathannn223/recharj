export type SubscriptionTier = 'free' | 'intermediate' | 'superior';

const TIER_ORDER: Record<SubscriptionTier, number> = { free: 0, intermediate: 1, superior: 2 };

export type EngagementFormat =
  | { kind: 'slider'; question: string; min: number; max: number; minLabel: string; maxLabel: string }
  | { kind: 'slider-double'; questions: [string, string] }
  | { kind: 'mcq-nuanced'; prompt: string; options: { text: string; feedback: string; isBest: boolean }[] }
  | { kind: 'predict-compare'; prompt: string; examples: string[] }
  | { kind: 'guided-response'; prompt: string; followUp: string }
  | { kind: 'free-plan'; prompt: string; examples: string[] };

// Narrower than EngagementFormat: per the content spec, the diagnostic step
// is always a slider (single or double) and the exercise step is always one
// of the other four — never the reverse. Typing it this way (instead of the
// full EngagementFormat union on both) lets TypeScript narrow exhaustively
// in the step-2/step-4 switches instead of leaving an impossible default case.
export type DiagnosticFormat = Extract<EngagementFormat, { kind: 'slider' } | { kind: 'slider-double' }>;
export type ExerciseFormat = Extract<
  EngagementFormat,
  { kind: 'mcq-nuanced' } | { kind: 'predict-compare' } | { kind: 'guided-response' } | { kind: 'free-plan' }
>;

export type CourseCard = {
  title: string;
  advice: string;
  sourceId: string | null; // null only for "Récap" cards
};

export type CourseContent = {
  hook: string;
  diagnostic: DiagnosticFormat;
  cards: CourseCard[];
  exercise: ExerciseFormat;
  // Optional single reordering rule: if the diagnostic score satisfies
  // `condition` (a tiny expression like "<=4" or ">=7", evaluated against
  // the numeric diagnostic answer), move `reorderCardIndexFirst` to the
  // front of `cards`. Deliberately not a general rules engine — every
  // course in the current content needs at most one such rule.
  personalization?: { condition: string; reorderCardIndexFirst: number };
};

export type CourseRow = {
  id: string;
  slug: string;
  title: string;
  order_index: number;
  tags: string[];
  free_tier_included: boolean;
  level: 1 | 2;
  parent_course_id: string | null;
  required_tier: SubscriptionTier;
  content: CourseContent;
};

export type SourceRow = {
  id: string;
  short_label: string;
  study_title: string;
  authors: string;
  year: number | null;
  journal_or_publisher: string | null;
  summary: string;
  external_url: string;
  is_scientific: boolean;
};

/**
 * Whether `tier` unlocks `course`. A free-tier-included course is always
 * accessible; otherwise `tier` must meet or exceed the course's
 * `required_tier` on the free < intermediate < superior order. Level-2
 * courses need nothing beyond that (no parent-completion requirement —
 * confirmed product decision, see consignes-implementation-cours.md).
 */
export function canAccessCourse(
  course: Pick<CourseRow, 'free_tier_included' | 'required_tier'>,
  tier: SubscriptionTier
): boolean {
  if (course.free_tier_included) return true;
  return TIER_ORDER[tier] >= TIER_ORDER[course.required_tier];
}

/** Evaluates a personalization condition like "<=4" or ">=7" against a diagnostic score. */
export function evaluatePersonalizationCondition(condition: string, score: number): boolean {
  const match = condition.match(/^(<=|>=|<|>|==)\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return false;
  const [, op, valueStr] = match;
  const value = Number(valueStr);
  switch (op) {
    case '<=':
      return score <= value;
    case '>=':
      return score >= value;
    case '<':
      return score < value;
    case '>':
      return score > value;
    case '==':
      return score === value;
    default:
      return false;
  }
}

/** Applies a course's `personalization` rule (if any) to its card order. */
export function personalizeCardOrder(content: CourseContent, diagnosticScore: number | null): CourseCard[] {
  const { cards, personalization } = content;
  if (!personalization || diagnosticScore === null) return cards;
  if (!evaluatePersonalizationCondition(personalization.condition, diagnosticScore)) return cards;
  const index = personalization.reorderCardIndexFirst;
  if (index <= 0 || index >= cards.length) return cards;
  const reordered = [...cards];
  const [card] = reordered.splice(index, 1);
  reordered.unshift(card);
  return reordered;
}
