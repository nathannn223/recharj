import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/lib/auth';
import {
  initialBatteryState,
  startOfToday,
  toDateKey,
  type BatteryState,
  type ProjectedDay,
  type SocialEvent,
} from '@/lib/battery';
import { syncBattery, type BatterySync } from '@/lib/batteryStore';

/**
 * Current battery state, caught up against `battery_days`.
 *
 * Takes the event list rather than fetching it, so a screen that already
 * calls useEvents() doesn't pay for a second round trip. `ready` must be
 * false while those events are still loading — syncing against an empty list
 * would persist days as if the user had nothing planned.
 */
export function useBattery(events: SocialEvent[], ready: boolean) {
  const { session } = useAuth();
  const [sync, setSync] = useState<BatterySync | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  // useEvents() hands back a fresh array on every focus refetch, so depending
  // on the array identity would re-run the sync (and its upsert) on every tab
  // switch. Depend on the content that actually feeds the model instead, plus
  // the calendar day so the state recomputes across midnight.
  const signature = useMemo(() => {
    const parts = events.map((e) => `${e.id}:${e.eventDate}:${e.difficulty}`).sort();
    return `${toDateKey(startOfToday())}#${parts.join('|')}`;
  }, [events]);

  const run = useCallback(async () => {
    if (!session || !ready) return;
    setLoading(true);
    const result = await syncBattery(session.user.id, events);
    setSync(result);
    setLoading(false);
    // `events` is intentionally not a dependency: `signature` is its stable
    // content-based proxy, and including both would defeat the point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, ready, signature, nonce]);

  useEffect(() => {
    run();
  }, [run]);

  const resync = useCallback(() => setNonce((n) => n + 1), []);

  const anchor: BatteryState = sync?.anchor ?? initialBatteryState();
  const today: ProjectedDay | null = sync?.today ?? null;
  const history: Map<string, number> = sync?.history ?? new Map();
  const checkIns: Map<string, { score: number; comment: string | null }> = sync?.checkIns ?? new Map();

  return {
    /** Closing state of yesterday — pass as `initialState` to projectBattery(). */
    anchor,
    /** Today's simulated day, or null until the first sync resolves. */
    today,
    /** Today's level as a whole percentage, defaulting to a full battery. */
    level: today ? Math.round(today.level) : 100,
    /** Persisted closing level per past day. */
    history,
    /** Check-ins in the same window as `history`, today included. */
    checkIns,
    loading,
    /** True when nothing could be read from or written to Supabase. */
    degraded: sync?.degraded ?? false,
    resync,
  };
}
