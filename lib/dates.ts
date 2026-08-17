import { toDateKey } from '@/lib/battery';

/** 'YYYY-MM-DD' -> "Aujourd'hui" / "Demain" / "Dans 5 jours" / "Mer. 19 août". */
export function relativeDayLabel(dateKey: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dateKey.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Demain';
  if (diffDays > 1 && diffDays <= 13) return `Dans ${diffDays} jours`;
  return shortFrenchDate(dateKey);
}

/** 'YYYY-MM-DD' -> "Mer. 19 août". */
export function shortFrenchDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const formatted = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export { toDateKey };
