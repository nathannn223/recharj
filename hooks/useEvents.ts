import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';

import { useAuth } from '@/lib/auth';
import type { SocialEvent } from '@/lib/battery';
import { supabase } from '@/lib/supabase';

type EventRow = {
  id: string;
  title: string | null;
  type: string;
  event_date: string;
  difficulty: number;
  description: string | null;
};

/** Shared shape for creating and editing an event (see app/add-event.tsx). */
export type EventInput = {
  title: string;
  type: string;
  eventDate: string;
  difficulty: number;
  description?: string;
};

function fromRow(row: EventRow): SocialEvent {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    eventDate: row.event_date,
    difficulty: row.difficulty,
    description: row.description,
  };
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
      .select('id, title, type, event_date, difficulty, description')
      .order('event_date', { ascending: true });
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setEvents((data as EventRow[]).map(fromRow));
    }
    setLoading(false);
  }, [session]);

  // Tab screens stay mounted when you switch away from them, so a plain
  // mount-only effect would leave this stale after adding an event on
  // another screen and coming back. Refetch on every focus instead.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const addEvent = useCallback(
    async (input: EventInput) => {
      if (!session) return { error: 'Pas de session active.' };
      const { error: insertError } = await supabase.from('events').insert({
        user_id: session.user.id,
        title: input.title.trim(),
        type: input.type,
        event_date: input.eventDate,
        difficulty: input.difficulty,
        description: input.description?.trim() || null,
      });
      if (insertError) return { error: insertError.message };
      await refresh();
      return { error: null };
    },
    [session, refresh]
  );

  const updateEvent = useCallback(
    async (id: string, input: EventInput) => {
      if (!session) return { error: 'Pas de session active.' };
      const { error: updateError } = await supabase
        .from('events')
        .update({
          title: input.title.trim(),
          type: input.type,
          event_date: input.eventDate,
          difficulty: input.difficulty,
          description: input.description?.trim() || null,
        })
        .eq('id', id);
      if (updateError) return { error: updateError.message };
      await refresh();
      return { error: null };
    },
    [session, refresh]
  );

  // RLS already scopes deletes to the caller's own rows, but the explicit
  // user_id filter keeps the intent visible at the call site and stops a
  // policy change from silently widening what this can touch.
  const deleteEvent = useCallback(
    async (id: string) => {
      if (!session) return { error: 'Pas de session active.' };
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);
      if (deleteError) return { error: deleteError.message };
      setEvents((prev) => prev.filter((e) => e.id !== id));
      return { error: null };
    },
    [session]
  );

  return { events, loading, error, refresh, addEvent, updateEvent, deleteEvent };
}
