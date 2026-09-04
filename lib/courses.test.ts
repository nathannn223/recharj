import { canAccessCourse, evaluatePersonalizationCondition, personalizeCardOrder, type CourseContent, type CourseRow } from './courses';

function course(overrides: Partial<Pick<CourseRow, 'id' | 'free_tier_included' | 'required_tier'>> = {}) {
  return {
    id: overrides.id ?? 'course-1',
    free_tier_included: overrides.free_tier_included ?? false,
    required_tier: overrides.required_tier ?? 'premium',
  } as const;
}

describe('canAccessCourse', () => {
  it('is always accessible when free_tier_included is true, regardless of the user tier', () => {
    expect(canAccessCourse(course({ free_tier_included: true, required_tier: 'premium' }), 'free')).toBe(true);
  });

  it('is accessible when it matches the onboarding-granted free course id, even on the free tier', () => {
    expect(canAccessCourse(course({ id: 'granted-course', required_tier: 'premium' }), 'free', 'granted-course')).toBe(true);
  });

  it('is not unlocked by a granted free course id that does not match this course', () => {
    expect(canAccessCourse(course({ id: 'other-course', required_tier: 'premium' }), 'free', 'granted-course')).toBe(false);
  });

  it('blocks a free-tier user from a course requiring premium', () => {
    expect(canAccessCourse(course({ required_tier: 'premium' }), 'free')).toBe(false);
  });

  it('lets a premium user access a course requiring premium', () => {
    expect(canAccessCourse(course({ required_tier: 'premium' }), 'premium')).toBe(true);
  });

  it('lets any tier access a course that only requires free', () => {
    expect(canAccessCourse(course({ required_tier: 'free' }), 'free')).toBe(true);
    expect(canAccessCourse(course({ required_tier: 'free' }), 'premium')).toBe(true);
  });
});

describe('evaluatePersonalizationCondition', () => {
  it.each([
    ['<=4', 4, true],
    ['<=4', 5, false],
    ['>=7', 7, true],
    ['>=7', 6, false],
    ['<3', 2, true],
    ['<3', 3, false],
    ['>8', 9, true],
    ['>8', 8, false],
    ['==5', 5, true],
    ['==5', 6, false],
  ] as const)('%s against %d -> %s', (condition, score, expected) => {
    expect(evaluatePersonalizationCondition(condition, score)).toBe(expected);
  });

  it('returns false for a condition string that does not match the expected shape', () => {
    expect(evaluatePersonalizationCondition('not-a-condition', 5)).toBe(false);
  });
});

describe('personalizeCardOrder', () => {
  const baseCards = [
    { title: 'A', advice: 'a', sourceId: null },
    { title: 'B', advice: 'b', sourceId: null },
    { title: 'C', advice: 'c', sourceId: null },
  ];

  function content(overrides: Partial<CourseContent> = {}): CourseContent {
    return {
      hook: 'hook',
      diagnostic: { kind: 'slider', question: 'q', min: 1, max: 10, minLabel: 'low', maxLabel: 'high' },
      cards: baseCards,
      exercise: { kind: 'guided-response', prompt: 'p', followUp: 'f' },
      ...overrides,
    };
  }

  it('returns the cards unchanged when there is no personalization rule', () => {
    expect(personalizeCardOrder(content(), 3)).toEqual(baseCards);
  });

  it('returns the cards unchanged when there is no diagnostic score yet', () => {
    const c = content({ personalization: { condition: '<=4', reorderCardIndexFirst: 2 } });
    expect(personalizeCardOrder(c, null)).toEqual(baseCards);
  });

  it('returns the cards unchanged when the condition is not met', () => {
    const c = content({ personalization: { condition: '<=4', reorderCardIndexFirst: 2 } });
    expect(personalizeCardOrder(c, 5)).toEqual(baseCards);
  });

  it('moves the target card to the front when the condition is met', () => {
    const c = content({ personalization: { condition: '<=4', reorderCardIndexFirst: 2 } });
    expect(personalizeCardOrder(c, 4)).toEqual([baseCards[2], baseCards[0], baseCards[1]]);
  });

  it('leaves the order unchanged if the target index is out of range', () => {
    const c = content({ personalization: { condition: '<=4', reorderCardIndexFirst: 0 } });
    expect(personalizeCardOrder(c, 4)).toEqual(baseCards);
  });
});
