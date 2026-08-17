export type SocialEvent = {
  id: string;
  type: string;
  eventDate: string; // 'YYYY-MM-DD'
  difficulty: number; // 1-10
};

// Recharj's projection model.
//
// Every event falls into one of four difficulty bands:
//   1    elite      — nothing happened, or an almost-effortless event.
//   2-3  negligible — no effect at all, same as no event.
//   4-5  mild       — doesn't push the level backward, just dampens
//                     that day's recovery, proportional to difficulty.
//   6-7  moderate   — does push the level backward, but at a reduced
//                     rate compared to the high band.
//   8-10 high       — pushes the level backward at the full rate.
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
//   eliteStreak — it's a "pause": the day still recovers (dampened if
//   4-5, full if 2-3), but at the flat BASE_RECOVERY rate, not the
//   accelerated one, and eliteStreak resumes exactly where it left off
//   on the next elite day.
// - A moderate or high day (6+) pushes the level backward and resets
//   eliteStreak to zero — a real setback ends any recovery streak.
//
// There is no live check-in in the MVP, so the model always assumes
// yesterday was fully charged (100) and simulates forward from there;
// "today" (day 0) is the first computed value and is what the Dashboard's
// big battery reads.
const BASE_RECOVERY = 6;
const STREAK_MULTIPLIER = 1.5;
const HIGH_THRESHOLD = 8;
const MODERATE_THRESHOLD = 6;
const NEGLIGIBLE_THRESHOLD = 3;
const ELITE_THRESHOLD = 1;
const HIGH_DRAIN_PER_POINT = 6;
const MODERATE_DRAIN_PER_POINT = 3;
const BASELINE = 100;

// Local-calendar-day key, deliberately not toISOString() (which converts to
// UTC first and can silently shift the date near midnight depending on the
// device's timezone offset).
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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

export type ProjectedDay = {
  date: string; // 'YYYY-MM-DD'
  level: number; // 0-100
  events: SocialEvent[];
};

/** Projects the battery level for `days` days starting today. */
export function projectBattery(events: SocialEvent[], days: number, fromDate: Date = startOfToday()): ProjectedDay[] {
  const eventsByDay = new Map<string, SocialEvent[]>();
  for (const ev of events) {
    const list = eventsByDay.get(ev.eventDate) ?? [];
    list.push(ev);
    eventsByDay.set(ev.eventDate, list);
  }

  const result: ProjectedDay[] = [];
  let level = BASELINE;
  let eliteStreak = 0;

  for (let i = 0; i < days; i++) {
    const date = toDateKey(addDays(fromDate, i));
    const dayEvents = eventsByDay.get(date) ?? [];
    const high = dayEvents.filter((e) => e.difficulty >= HIGH_THRESHOLD);
    const moderate = dayEvents.filter((e) => e.difficulty >= MODERATE_THRESHOLD && e.difficulty < HIGH_THRESHOLD);
    const isElite = dayEvents.every((e) => e.difficulty <= ELITE_THRESHOLD); // vacuously true if empty

    if (high.length > 0 || moderate.length > 0) {
      const drain =
        high.reduce((sum, e) => sum + e.difficulty * HIGH_DRAIN_PER_POINT, 0) +
        moderate.reduce((sum, e) => sum + e.difficulty * MODERATE_DRAIN_PER_POINT, 0);
      level = Math.max(0, level - drain);
      eliteStreak = 0;
    } else if (isElite) {
      eliteStreak += 1;
      const recovery = BASE_RECOVERY * STREAK_MULTIPLIER ** (eliteStreak - 1);
      level = Math.min(100, level + recovery);
    } else {
      // Negligible (2-3) or mild (4-5): a pause, not a setback — recovers
      // at the flat base rate (dampened if 4-5), and the elite streak
      // resumes right where it left off on the next elite day.
      const notableMilds = dayEvents.filter((e) => e.difficulty > NEGLIGIBLE_THRESHOLD);
      const worstMild = notableMilds.length > 0 ? Math.max(...notableMilds.map((e) => e.difficulty)) : 0;
      const dampening = 1 - worstMild / 10;
      level = Math.min(100, level + BASE_RECOVERY * dampening);
    }

    result.push({ date, level, events: dayEvents });
  }
  return result;
}

/** Battery-level band (0-100 scale) used for the calendar's per-day bar. */
export function levelBand(level: number): 'low' | 'mid' | 'high' {
  if (level >= 70) return 'high';
  if (level >= 40) return 'mid';
  return 'low';
}
