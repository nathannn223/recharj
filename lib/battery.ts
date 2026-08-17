export type SocialEvent = {
  id: string;
  type: string;
  eventDate: string; // 'YYYY-MM-DD'
  difficulty: number; // 1-10
};

// Recharj's projection model: the battery recovers a fixed amount on any
// day with no events (fully-rested baseline), and each event on a given
// day drains it proportionally to how difficult the user marked it —
// several events on the same day stack. There is no live check-in in the
// MVP, so the model always assumes yesterday was fully charged (100) and
// simulates forward from there; "today" (day 0) is the first computed
// value and is what the Dashboard's big battery reads.
const RECOVERY_PER_DAY = 14;
const DRAIN_PER_DIFFICULTY_POINT = 6;
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
  for (let i = 0; i < days; i++) {
    const date = toDateKey(addDays(fromDate, i));
    const dayEvents = eventsByDay.get(date) ?? [];
    const drain = dayEvents.reduce((sum, e) => sum + e.difficulty * DRAIN_PER_DIFFICULTY_POINT, 0);
    level = Math.max(0, Math.min(100, level + RECOVERY_PER_DAY - drain));
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
