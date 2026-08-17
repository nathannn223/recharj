import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/lib/auth';
import type { SocialEvent } from '@/lib/battery';
import { supabase } from '@/lib/supabase';

type EventRow = {
  id: string;
  type: string;
  event_date: string;
  difficulty: number;
};

function fromRow(row: EventRow): SocialEvent {
  return { id: row.id, type: row.type, eventDate: row.event_date, difficulty: row.difficulty };
}

export function useEvents() {
  const { session } = useAuth();
  const [events, setEvents] = useState<SocialEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('events')
      .select('id, type, event_date, difficulty')
      .order('event_date', { ascending: true });
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setEvents((data as EventRow[]).map(fromRow));
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addEvent = useCallback(
    async (input: { type: string; eventDate: string; difficulty: number }) => {
      if (!session) return { error: 'Pas de session active.' };
      const { error: insertError } = await supabase.from('events').insert({
        user_id: session.user.id,
        type: input.type,
        event_date: input.eventDate,
        difficulty: input.difficulty,
      });
      if (insertError) return { error: insertError.message };
      await refresh();
      return { error: null };
    },
    [session, refresh]
  );

  return { events, loading, error, refresh, addEvent };
}
