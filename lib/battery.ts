export type SocialEvent = {
  id: string;
  title: string | null;
  type: string;
  eventDate: string; // 'YYYY-MM-DD'
  difficulty: number; // 1-10
  description: string | null;
};

// Recharj's projection model.
//
// Every event falls into one of four difficulty bands:
//   1    elite      — nothing happened, or an almost-effortless event.
//   2-3  negligible — no effect at all, same as no event: full recovery.
//   4-5  mild       — a real but modest ask. Neutral: doesn't cost
//                     anything, but doesn't recharge the day either.
//   6-10 draining   — pushes the level backward, on a single continuous
//                     curve (see drainFor()) rather than a stepped rate,
//                     so two neighbouring difficulty values never produce
//                     wildly different drains.
//
// Two different streaks track history, because "not draining" and
// "actively accelerating recovery" aren't the same thing:
//
// - `eliteStreak` counts consecutive ELITE days only (nothing, or a
//   difficulty-1 event). It's what the compounding recovery formula
//   BASE_RECOVERY * STREAK_MULTIPLIER^(eliteStreak-1) is keyed on — the
//   longer an unbroken run of near-total-rest days, the faster recovery
//   gets. This is what makes a very low battery take several consecutive
//   great days before recovery visibly speeds up.
// - A negligible or mild day (2-5) neither breaks nor advances
//   eliteStreak — it's a "pause": negligible still recovers at the flat
//   BASE_RECOVERY rate, mild holds the level steady, and eliteStreak
//   resumes exactly where it left off on the next elite day.
// - A draining day (6+) pushes the level backward and resets eliteStreak
//   to zero — a real setback ends any recovery streak.
//
// The model is CARRY-FORWARD: a day's closing level is the next day's
// opening level. There is no live check-in in the MVP, so the level is
// never observed directly — it is simulated from the events the user
// planned, day after day, starting from the last state persisted in
// `battery_days` (see lib/batteryStore.ts). A user with no history at
// all starts from a full battery, which is what the model assumed
// unconditionally before persistence existed.
export const BASE_RECOVERY = 6;
export const STREAK_MULTIPLIER = 1.5;
export const MODERATE_THRESHOLD = 6;
export const NEGLIGIBLE_THRESHOLD = 3;
export const ELITE_THRESHOLD = 1;
export const HIGH_DRAIN_PER_POINT = 6;
export const MODERATE_DRAIN_PER_POINT = 3;
// The two ends of the drain curve, in the exact values the stepped model
// already used at difficulty 6 and difficulty 10 (6 * 3, 10 * 6) — kept as
// the anchor points so the already-tuned extremes don't move, only the
// steps in between smooth out.
export const DRAIN_AT_MODERATE_THRESHOLD = MODERATE_THRESHOLD * MODERATE_DRAIN_PER_POINT;
export const DRAIN_AT_MAX_DIFFICULTY = 10 * HIGH_DRAIN_PER_POINT;
export const BASELINE = 100;
export const MAX_LEVEL = 100;
export const MIN_LEVEL = 0;
export const MAX_STREAK_EXPONENT = 32;

/**
 * How much a single event of this difficulty drains the battery. 0 below
 * the draining threshold; above it, a straight line between the two
 * already-validated endpoints (6 -> 18, 10 -> 60), so there is no jump
 * between neighbouring difficulty values the way the old stepped rates
 * produced (7 -> 21, 8 -> 48, more than double for one notch).
 */
export function drainFor(difficulty: number): number {
  if (difficulty < MODERATE_THRESHOLD) return 0;
  const t = (difficulty - MODERATE_THRESHOLD) / (10 - MODERATE_THRESHOLD);
  return DRAIN_AT_MODERATE_THRESHOLD + t * (DRAIN_AT_MAX_DIFFICULTY - DRAIN_AT_MODERATE_THRESHOLD);
}

// Local-calendar-day key, deliberately not toISOString() (which converts to
// UTC first and can silently shift the date near midnight depending on the
// device's timezone offset).
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 'YYYY-MM-DD' -> local Date at midnight. Mirror of toDateKey(). */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Whole calendar days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.round((b - a) / 86400000);
}

/**
 * Everything the model needs to carry from one day to the next. `level` is
 * the closing level of the day this state describes; `eliteStreak` is the
 * run of consecutive elite days ending on it.
 */
export type BatteryState = {
  level: number; // 0-100
  eliteStreak: number;
};

/**
 * State assumed for the day before a user's first ever simulated day.
 * A brand-new user starts from a full battery — the same assumption the
 * model made unconditionally before `battery_days` existed, so first-launch
 * behaviour is unchanged.
 */
export function initialBatteryState(): BatteryState {
  return { level: BASELINE, eliteStreak: 0 };
}

export type ProjectedDay = {
  date: string; // 'YYYY-MM-DD'
  level: number; // 0-100
  eliteStreak: number;
  events: SocialEvent[];
};

/**
 * Advances the battery by exactly one day. Pure: same state + same events
 * always give the same result, which is what makes gap-filling and
 * forward projection share one implementation.
 */
export function stepBattery(state: BatteryState, dayEvents: SocialEvent[]): BatteryState {
  const isElite = dayEvents.every((e) => e.difficulty <= ELITE_THRESHOLD); // vacuously true if empty
  const isDraining = dayEvents.some((e) => e.difficulty >= MODERATE_THRESHOLD);

  if (isDraining) {
    const drain = dayEvents.reduce((sum, e) => sum + drainFor(e.difficulty), 0);
    return { level: Math.max(MIN_LEVEL, state.level - drain), eliteStreak: 0 };
  }

  if (isElite) {
    const eliteStreak = state.eliteStreak + 1;
    // The exponent is capped purely to stay in finite arithmetic: 1.5^32 is
    // already ~4.3 million, i.e. far past the point where the +recovery is
    // clamped to MAX_LEVEL anyway, so the cap is behaviourally invisible.
    // Without it a streak of a few hundred days overflows to Infinity.
    const exponent = Math.min(eliteStreak - 1, MAX_STREAK_EXPONENT);
    const recovery = BASE_RECOVERY * STREAK_MULTIPLIER ** exponent;
    return { level: Math.min(MAX_LEVEL, state.level + recovery), eliteStreak };
  }

  // Negligible (2-3): a pause, not a setback — recovers at the flat base
  // rate, and the elite streak resumes right where it left off on the next
  // elite day. Mild (4-5): a real ask, but not a setback either — holds the
  // level steady instead of recovering, without breaking the streak.
  const worstEvent = dayEvents.reduce((max, e) => Math.max(max, e.difficulty), 0);
  const isMild = worstEvent > NEGLIGIBLE_THRESHOLD;
  const level = isMild ? state.level : Math.min(MAX_LEVEL, state.level + BASE_RECOVERY);
  return { level, eliteStreak: state.eliteStreak };
}

/** Groups events by their 'YYYY-MM-DD' key. */
export function groupEventsByDay(events: SocialEvent[]): Map<string, SocialEvent[]> {
  const byDay = new Map<string, SocialEvent[]>();
  for (const ev of events) {
    const list = byDay.get(ev.eventDate) ?? [];
    list.push(ev);
    byDay.set(ev.eventDate, list);
  }
  return byDay;
}

/**
 * Projects the battery level for `days` days starting at `fromDate`.
 *
 * `initialState` is the CLOSING state of the day *before* `fromDate` — pass
 * the anchor loaded from `battery_days` to project from the user's real
 * level. Omitting it reproduces the pre-persistence behaviour (start from a
 * full battery), which is still the right default for a user with no
 * history yet.
 */
export function projectBattery(
  events: SocialEvent[],
  days: number,
  fromDate: Date = startOfToday(),
  initialState: BatteryState = initialBatteryState()
): ProjectedDay[] {
  const eventsByDay = groupEventsByDay(events);

  const result: ProjectedDay[] = [];
  let state = initialState;

  for (let i = 0; i < days; i++) {
    const date = toDateKey(addDays(fromDate, i));
    const dayEvents = eventsByDay.get(date) ?? [];
    state = stepBattery(state, dayEvents);
    result.push({ date, level: state.level, eliteStreak: state.eliteStreak, events: dayEvents });
  }
  return result;
}

/** Battery-level band (0-100 scale) used for the calendar's per-day bar. */
export function levelBand(level: number): 'low' | 'mid' | 'high' {
  if (level >= 70) return 'high';
  if (level >= 40) return 'mid';
  return 'low';
}
