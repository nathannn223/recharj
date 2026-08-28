import {
  BASE_RECOVERY,
  MAX_LEVEL,
  MAX_STREAK_EXPONENT,
  MIN_LEVEL,
  STREAK_MULTIPLIER,
  addDays,
  daysBetween,
  drainFor,
  fromDateKey,
  groupEventsByDay,
  initialBatteryState,
  levelBand,
  projectBattery,
  stepBattery,
  toDateKey,
  type BatteryState,
  type SocialEvent,
} from './battery';

function event(difficulty: number, overrides: Partial<SocialEvent> = {}): SocialEvent {
  return {
    id: overrides.id ?? `ev-${difficulty}`,
    title: null,
    type: 'Test',
    eventDate: '2026-01-01',
    difficulty,
    description: null,
    ...overrides,
  };
}

describe('drainFor', () => {
  it('is zero below the draining threshold', () => {
    for (let d = 1; d <= 5; d++) expect(drainFor(d)).toBe(0);
  });

  it('matches the two already-validated endpoints', () => {
    expect(drainFor(6)).toBe(18);
    expect(drainFor(10)).toBe(60);
  });

  it('is continuous: no jump bigger than one interpolation step between neighbours', () => {
    const values = Array.from({ length: 5 }, (_, i) => drainFor(6 + i));
    for (let i = 1; i < values.length; i++) {
      expect(values[i] - values[i - 1]).toBeCloseTo(10.5, 5);
    }
  });
});

describe('stepBattery', () => {
  const full = initialBatteryState();

  it('elite day (empty or difficulty 1) starts a streak and recovers by the base amount', () => {
    const start: BatteryState = { level: 50, eliteStreak: 0 };
    const next = stepBattery(start, []);
    expect(next).toEqual({ level: 50 + BASE_RECOVERY, eliteStreak: 1 });
  });

  it('elite streak compounds on consecutive elite days', () => {
    let state: BatteryState = { level: 0, eliteStreak: 2 };
    state = stepBattery(state, [event(1)]);
    expect(state.eliteStreak).toBe(3);
    expect(state.level).toBeCloseTo(BASE_RECOVERY * STREAK_MULTIPLIER ** 2, 5);
  });

  it('negligible (2-3) fully recovers without touching the streak', () => {
    const start: BatteryState = { level: 50, eliteStreak: 4 };
    const next = stepBattery(start, [event(3)]);
    expect(next).toEqual({ level: 50 + BASE_RECOVERY, eliteStreak: 4 });
  });

  it('mild (4-5) holds the level steady and preserves the streak', () => {
    const start: BatteryState = { level: 50, eliteStreak: 4 };
    expect(stepBattery(start, [event(4)])).toEqual({ level: 50, eliteStreak: 4 });
    expect(stepBattery(start, [event(5)])).toEqual({ level: 50, eliteStreak: 4 });
  });

  it('draining (6+) subtracts drainFor(difficulty) and resets the streak', () => {
    const start: BatteryState = { level: 50, eliteStreak: 4 };
    const next = stepBattery(start, [event(8)]);
    expect(next).toEqual({ level: 50 - drainFor(8), eliteStreak: 0 });
  });

  it('sums drain across multiple events the same day', () => {
    const start: BatteryState = { level: 100, eliteStreak: 0 };
    const next = stepBattery(start, [event(6), event(7)]);
    expect(next.level).toBeCloseTo(100 - drainFor(6) - drainFor(7), 5);
  });

  it('a draining event outweighs a mild one on the same day', () => {
    const start: BatteryState = { level: 100, eliteStreak: 0 };
    const next = stepBattery(start, [event(4), event(9)]);
    expect(next).toEqual({ level: 100 - drainFor(9), eliteStreak: 0 });
  });

  it('clamps at MAX_LEVEL and MIN_LEVEL', () => {
    expect(stepBattery({ level: 99, eliteStreak: 0 }, []).level).toBeLessThanOrEqual(MAX_LEVEL);
    expect(stepBattery({ level: 5, eliteStreak: 0 }, [event(10)]).level).toBe(MIN_LEVEL);
  });

  it('never overflows to Infinity across a very long elite streak', () => {
    let state: BatteryState = { level: 0, eliteStreak: 0 };
    for (let i = 0; i < 500; i++) state = stepBattery(state, []);
    expect(Number.isFinite(state.level)).toBe(true);
    expect(state.level).toBe(MAX_LEVEL);
    expect(state.eliteStreak - 1).toBeGreaterThanOrEqual(MAX_STREAK_EXPONENT);
  });

  it('a full battery cannot recover further', () => {
    expect(stepBattery(full, []).level).toBe(MAX_LEVEL);
  });
});

describe('projectBattery', () => {
  it('carries state forward day over day from the given initial state', () => {
    const events = [event(8, { eventDate: '2026-01-02' })];
    const days = projectBattery(events, 3, new Date(2026, 0, 1), { level: 100, eliteStreak: 0 });
    expect(days).toHaveLength(3);
    expect(days[0].date).toBe('2026-01-01');
    expect(days[0].level).toBe(100); // elite day 1, already full
    expect(days[1].date).toBe('2026-01-02');
    expect(days[1].level).toBeCloseTo(100 - drainFor(8), 5); // the draining event
    expect(days[2].level).toBeGreaterThan(days[1].level); // recovers the next elite day
  });

  it('defaults to a full battery when no initial state is given', () => {
    const [day] = projectBattery([], 1, new Date(2026, 0, 1));
    expect(day.level).toBe(MAX_LEVEL);
  });

  it('attaches each day only its own events', () => {
    const events = [event(8, { id: 'a', eventDate: '2026-01-01' }), event(3, { id: 'b', eventDate: '2026-01-02' })];
    const days = projectBattery(events, 2, new Date(2026, 0, 1));
    expect(days[0].events.map((e) => e.id)).toEqual(['a']);
    expect(days[1].events.map((e) => e.id)).toEqual(['b']);
  });
});

describe('groupEventsByDay', () => {
  it('groups by eventDate, preserving insertion order within a day', () => {
    const events = [event(1, { id: 'a', eventDate: '2026-01-01' }), event(2, { id: 'b', eventDate: '2026-01-01' })];
    const grouped = groupEventsByDay(events);
    expect(grouped.get('2026-01-01')?.map((e) => e.id)).toEqual(['a', 'b']);
  });
});

describe('date helpers', () => {
  it('toDateKey and fromDateKey round-trip', () => {
    const date = new Date(2026, 5, 15);
    expect(fromDateKey(toDateKey(date)).getTime()).toBe(date.getTime());
  });

  it('addDays moves by whole calendar days', () => {
    expect(toDateKey(addDays(new Date(2026, 0, 31), 1))).toBe('2026-02-01');
  });

  it('daysBetween counts whole calendar days regardless of time of day', () => {
    const from = new Date(2026, 0, 1, 23, 0);
    const to = new Date(2026, 0, 3, 1, 0);
    expect(daysBetween(from, to)).toBe(2);
  });
});

describe('levelBand', () => {
  it('bands the 0-100 scale into low/mid/high', () => {
    expect(levelBand(0)).toBe('low');
    expect(levelBand(39)).toBe('low');
    expect(levelBand(40)).toBe('mid');
    expect(levelBand(69)).toBe('mid');
    expect(levelBand(70)).toBe('high');
    expect(levelBand(100)).toBe('high');
  });
});
