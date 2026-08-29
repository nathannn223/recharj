import { addDays, startOfToday, toDateKey } from '@/lib/battery';
import { supabase } from '@/lib/supabase';

// Only today can ever be checked in — no backfilling a missed day. That
// keeps the persistence model simple: today is always inside the window
// lib/batteryStore.ts's syncBattery() recomputes on every call, so a
// check-in written now is guaranteed to be picked up correctly. Backfilling
// yesterday would mean cascading a recompute through every day between it
// and today, since each day's state carries the previous one forward —
// real complexity for a feature not asked for yet.
export async function submitCheckIn(userId: string, score: number, comment: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('daily_checkins')
    .upsert({ user_id: userId, day: toDateKey(startOfToday()), score, comment: comment.trim() || null }, { onConflict: 'user_id,day' });
  return { error: error?.message ?? null };
}

const STREAK_WINDOW_DAYS = 400;

/**
 * Consecutive days checked in, counting back from today. Computed
 * client-side from a bounded window rather than a recursive SQL query —
 * simple, and a streak longer than this window is already well past the
 * point where showing the exact number still matters.
 */
export async function fetchCheckInStreak(userId: string): Promise<number> {
  const today = startOfToday();
  const windowStart = toDateKey(addDays(today, -STREAK_WINDOW_DAYS));
  const { data } = await supabase
    .from('daily_checkins')
    .select('day')
    .eq('user_id', userId)
    .gte('day', windowStart)
    .order('day', { ascending: false });

  if (!data || data.length === 0) return 0;
  const days = new Set(data.map((row) => row.day as string));

  let streak = 0;
  let cursor = today;
  while (days.has(toDateKey(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
