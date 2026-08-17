export type SocialEvent = {
  id: string;
  type: string;
  eventDate: string; // 'YYYY-MM-DD'
  difficulty: number; // 1-10
};

// Recharj's projection model.
//
// Every event falls into one of four difficulty bands, each with a
// distinct effect on that day:
//   1-3  negligible — no effect at all, same as no event.
//   4-5  mild       — doesn't push the level backward, just dampens
//                     that day's recovery, proportional to difficulty.
//   6-7  moderate   — does push the level backward, but at a reduced
//                     rate compared to the high band.
//   8-10 high       — pushes the level backward at the full rate.
//
// Any day where the level moves backward (moderate or high) resets the
// recovery streak to zero, since it's no longer a day building toward
// recovery. A "streak day" (negligible/mild only, or nothing at all) grows
// the streak, and that day's recovery is
// BASE_RECOVERY * STREAK_MULTIPLIER^(streak-1) — i.e. it compounds the
// longer you go without a setback. This is what makes a very low battery
// take more consecutive good days to reach 100: the first streak days
// only recover a little, and the gain accelerates from there.
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
  let streak = 0;
  for (let i = 0; i < days; i++) {
    const date = toDateKey(addDays(fromDate, i));
    const dayEvents = eventsByDay.get(date) ?? [];
    const high = dayEvents.filter((e) => e.difficulty >= HIGH_THRESHOLD);
    const moderate = dayEvents.filter((e) => e.difficulty >= MODERATE_THRESHOLD && e.difficulty < HIGH_THRESHOLD);
    const milds = dayEvents.filter((e) => e.difficulty < MODERATE_THRESHOLD);

    if (high.length > 0 || moderate.length > 0) {
      const drain =
        high.reduce((sum, e) => sum + e.difficulty * HIGH_DRAIN_PER_POINT, 0) +
        moderate.reduce((sum, e) => sum + e.difficulty * MODERATE_DRAIN_PER_POINT, 0);
      level = Math.max(0, level - drain);
      streak = 0;
    } else {
      streak += 1;
      const scheduledRecovery = BASE_RECOVERY * STREAK_MULTIPLIER ** (streak - 1);
      const notableMilds = milds.filter((e) => e.difficulty > NEGLIGIBLE_THRESHOLD);
      const worstMild = notableMilds.length > 0 ? Math.max(...notableMilds.map((e) => e.difficulty)) : 0;
      const dampening = 1 - worstMild / 10; // a notable-but-mild event slows the day's gain, never reverses it
      level = Math.min(100, level + scheduledRecovery * dampening);
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
