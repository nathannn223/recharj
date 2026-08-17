// Maps an event's free-text type (the chips in add-event.tsx) to the course
// tags that are actually relevant to it, so the Dashboard can recommend a
// specific course instead of a generic "go browse the library" link.
const EVENT_TYPE_TAGS: Record<string, string[]> = {
  'Repas de famille': ['famille', 'repas'],
  'Travail': ['travail'],
  'Soirée entre amis': ['amitie', 'conversation'],
  'Rendez-vous': ['conversation'],
};

export function tagsForEventType(type: string): string[] {
  return EVENT_TYPE_TAGS[type] ?? [];
}
