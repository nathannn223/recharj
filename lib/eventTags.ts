// Event type options shown as chips in app/add-event.tsx. `id` is what's
// stored on events.type; the display label is looked up by id through
// i18next (data.eventTypes.<id>).
export const EVENT_TYPE_IDS: string[] = ['family_meal', 'work', 'friends_evening', 'date', 'other'];

// Maps an event type id to the course tags actually relevant to it, so the
// Dashboard can recommend a specific course instead of a generic "go browse
// the library" link.
const EVENT_TYPE_TAGS: Record<string, string[]> = {
  family_meal: ['famille', 'repas'],
  work: ['travail'],
  friends_evening: ['amitie'],
  date: ['conversation'],
};

export function tagsForEventType(typeId: string): string[] {
  return EVENT_TYPE_TAGS[typeId] ?? [];
}
