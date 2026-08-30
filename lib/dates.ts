import i18n from '@/lib/i18n';
import { toDateKey } from '@/lib/battery';

const LOCALE_TAG: Record<string, string> = { fr: 'fr-FR', en: 'en-US' };

/** 'YYYY-MM-DD' -> "Aujourd'hui" / "Demain" / "Dans 5 jours" / "Mer. 19 août" (localized). */
export function relativeDayLabel(dateKey: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = dateKey.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);

  if (diffDays === 0) return i18n.t('dates.today');
  if (diffDays === 1) return i18n.t('dates.tomorrow');
  if (diffDays > 1 && diffDays <= 13) return i18n.t('dates.inDays', { count: diffDays });
  return shortLocalDate(dateKey);
}

/** 'YYYY-MM-DD' -> "Mer. 19 août" / "Wed, Aug 19", in the app's current language. */
export function shortLocalDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const locale = LOCALE_TAG[i18n.language] ?? 'en-US';
  const formatted = date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'long' });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/** A `Date` -> "Mercredi 19 août" / "Wednesday, August 19", full weekday spelled out, in the app's current language. */
export function longLocalDate(date: Date): string {
  const locale = LOCALE_TAG[i18n.language] ?? 'en-US';
  const formatted = date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/** A `Date` -> "Août 2026" / "August 2026", in the app's current language. */
export function monthYearLabel(date: Date): string {
  const locale = LOCALE_TAG[i18n.language] ?? 'en-US';
  const formatted = date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/** Monday-first narrow weekday initials ("L M M J V S D" / "M T W T F S S") for the app's current language. */
export function weekdayInitials(): string[] {
  const locale = LOCALE_TAG[i18n.language] ?? 'en-US';
  // 2024-01-01 was a Monday — an arbitrary anchor, only the weekday of each offset matters.
  const monday = new Date(2024, 0, 1);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toLocaleDateString(locale, { weekday: 'narrow' });
  });
}

export { toDateKey };
