import {
  addDays,
  daysBetween,
  fromDateKey,
  initialBatteryState,
  projectBattery,
  startOfToday,
  toDateKey,
  type BatteryState,
  type ProjectedDay,
  type SocialEvent,
} from '@/lib/battery';
import { supabase } from '@/lib/supabase';

// Persistence + catch-up layer on top of the pure model in lib/battery.ts.
//
// The model itself has no memory: stepBattery() turns yesterday's closing
// state into today's. This module is what supplies "yesterday" — it reads
// the last row of `battery_days` strictly before today, replays every day
// missing between that anchor and today using the user's real events, and
// writes the result back. That is what makes the Dashboard's hero gauge show
// something other than a permanent 100%.

/** How far back history is loaded. Beyond this the anchor is treated as stale. */
const HISTORY_WINDOW_DAYS = 400;

/**
 * Upper bound on days replayed in one catch-up. Guards against a corrupted
 * or clock-skewed anchor turning into an unbounded loop; a user genuinely
 * away longer than this is caught up from a fresh full battery, which is the
 * same assumption made for a brand-new user.
 */
const MAX_CATCHUP_DAYS = HISTORY_WINDOW_DAYS;

type BatteryDayRow = {
  day: string; // 'YYYY-MM-DD'
  level: number;
  elite_streak: number;
};

export type BatterySync = {
  /** Closing state of YESTERDAY — the starting point for projecting today onward. */
  anchor: BatteryState;
  /** Today's simulated day, already stepped from `anchor`. */
  today: ProjectedDay;
  /** Persisted closing level per past day ('YYYY-MM-DD' -> 0-100). Excludes today. */
  history: Map<string, number>;
  /**
   * True when the state could not be read from or written to Supabase (table
   * not migrated yet, offline, RLS issue). The returned values are still
   * usable — they fall back to the pre-persistence behaviour of starting from
   * a full battery — but nothing was saved.
   */
  degraded: boolean;
};

function inMemoryFallback(events: SocialEvent[]): BatterySync {
  const today = startOfToday();
  const [todayDay] = projectBattery(events, 1, today, initialBatteryState());
  return {
    anchor: initialBatteryState(),
    today: todayDay,
    history: new Map(),
    degraded: true,
  };
}

/**
 * Brings `battery_days` up to date and returns the current state.
 *
 * Only the window from the anchor to today is (re)computed. Days already
 * closed further back are left untouched: they are a record of what the user
 * actually lived through, not a view derived from the current event list, so
 * editing or deleting a past event does not rewrite them.
 */
export async function syncBattery(userId: string, events: SocialEvent[]): Promise<BatterySync> {
  const today = startOfToday();
  const todayKey = toDateKey(today);
  const windowStartKey = toDateKey(addDays(today, -HISTORY_WINDOW_DAYS));

  const { data, error } = await supabase
    .from('battery_days')
    .select('day, level, elite_streak')
    .gte('day', windowStartKey)
    .lte('day', todayKey)
    .order('day', { ascending: true });

  if (error) return inMemoryFallback(events);

  const rows = (data ?? []) as BatteryDayRow[];
  const history = new Map<string, number>();
  for (const row of rows) {
    if (row.day < todayKey) history.set(row.day, row.level);
  }

  // The anchor is the most recent CLOSED day, i.e. strictly before today.
  // A row for today itself is ignored on purpose: today is always recomputed
  // from yesterday, so that adding or deleting an event today is reflected
  // immediately instead of being frozen by the first sync of the day.
  const anchorRow = [...rows].reverse().find((row) => row.day < todayKey) ?? null;

  const anchorDay = anchorRow ? fromDateKey(anchorRow.day) : addDays(today, -1);
  const anchorState: BatteryState = anchorRow
    ? { level: anchorRow.level, eliteStreak: anchorRow.elite_streak }
    : initialBatteryState();

  // Number of days to replay, today included. 1 means "only today is missing".
  const rawSpan = daysBetween(anchorDay, today);
  if (rawSpan < 1) {
    // Anchor is today or in the future — only possible with a clock change.
    // Recompute today from a full battery rather than trusting it.
    return inMemoryFallback(events);
  }
  const span = Math.min(rawSpan, MAX_CATCHUP_DAYS);
  const replayFrom = span === rawSpan ? addDays(anchorDay, 1) : addDays(today, -(span - 1));
  const replayState = span === rawSpan ? anchorState : initialBatteryState();

  const replayed = projectBattery(events, span, replayFrom, replayState);
  const todayDay = replayed[replayed.length - 1];
  const yesterdayState: BatteryState =
    replayed.length >= 2
      ? { level: replayed[replayed.length - 2].level, eliteStreak: replayed[replayed.length - 2].eliteStreak }
      : replayState;

  for (const day of replayed) {
    if (day.date < todayKey) history.set(day.date, Math.round(day.level));
  }

  const { error: upsertError } = await supabase.from('battery_days').upsert(
    replayed.map((day) => ({
      user_id: userId,
      day: day.date,
      level: Math.round(day.level),
      elite_streak: day.eliteStreak,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: 'user_id,day' }
  );

  return {
    anchor: yesterdayState,
    today: todayDay,
    history,
    degraded: !!upsertError,
  };
}
