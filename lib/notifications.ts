import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'battery-reminder';

const DAILY_REMINDER_ID = 'daily-reminder';
const CHECKIN_REMINDER_ID = 'checkin-reminder';

// Matches the CheckInCard's URGENT_HOUR (components/CheckInCard.tsx) so the
// card and this notification never disagree about when the streak actually
// becomes urgent — 2 hours before it dies at midnight.
const CHECKIN_REMINDER_HOUR = 22;

// Matches lib/momentOfDay.ts's MOMENT_OPTIONS labels. An unrecognized label
// (shouldn't happen — it's always one of these four) falls back to evening.
const MOMENT_HOURS: Record<string, number> = {
  'Le matin': 8,
  "L'après-midi": 14,
  'Le soir': 19,
  'La nuit': 22,
};

async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Rappel de batterie sociale',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export type ReminderCourse = { id: string; title: string };
export type ReminderEvent = { title: string | null; type: string };

export type ReminderContext = {
  momentLabel: string;
  batteryLevel: number; // 0-100, today's real projected level
  // The next upcoming hard event and the course matched to it, if any —
  // takes priority over everything else when both are present.
  upcomingEvent?: ReminderEvent | null;
  matchedCourse?: ReminderCourse | null;
  // Fallback when there's no hard event to prepare for: the next course
  // the user hasn't completed yet, so the daily touchpoint still points
  // somewhere useful instead of only ever firing on a bad day.
  discoverCourse?: ReminderCourse | null;
};

function contentFor(ctx: ReminderContext): { title: string; body: string; courseId?: string } {
  if (ctx.upcomingEvent && ctx.matchedCourse) {
    const label = ctx.upcomingEvent.title || ctx.upcomingEvent.type;
    return {
      title: 'Un événement approche',
      body: `Prépare "${label}" avec le cours "${ctx.matchedCourse.title}".`,
      courseId: ctx.matchedCourse.id,
    };
  }
  if (ctx.batteryLevel < 40) {
    return {
      title: 'Grosse baisse en vue',
      body: `Ta batterie sera basse ${ctx.momentLabel.toLowerCase()}. Découvre comment t'y préparer.`,
    };
  }
  if (ctx.discoverCourse) {
    return {
      title: "Un nouveau cours t'attend",
      body: `Découvre "${ctx.discoverCourse.title}" en quelques minutes.`,
      courseId: ctx.discoverCourse.id,
    };
  }
  return { title: 'Reste sur la bonne voie', body: 'Prends deux minutes pour toi aujourd’hui.' };
}

// Reschedules the daily reminder with content reflecting the user's actual
// state right now — a hard event to prepare for, a real battery dip, or
// (when neither applies) a nudge toward the next course they haven't tried.
// Fires at the hour chosen during onboarding (MOMENT_HOURS). Called once
// during onboarding and again every time the Dashboard has fresh data, so
// the notification a user gets tonight reflects today, not whatever was
// true when they signed up. No-ops silently if permission was never
// granted or was later revoked — never re-prompts.
//
// Uses a fixed identifier and cancels only that identifier before
// rescheduling, so it never touches scheduleCheckInReminder()'s own
// notification below — the two are independent and can coexist.
export async function scheduleDailyReminder(ctx: ReminderContext): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  const hour = MOMENT_HOURS[ctx.momentLabel] ?? MOMENT_HOURS['Le soir'];
  const { title, body, courseId } = contentFor(ctx);

  await ensureChannel();
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: { title, body, data: courseId ? { courseId } : undefined },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
      channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
    },
  });
}

// Fires at a fixed hour (22:00, 2 hours before the streak would actually
// die at midnight) regardless of the user's chosen moment-of-day — this one
// is tied to a deadline, not a preference. Content depends on whether
// there's a streak actually at risk: urgent "it's about to die" copy when
// there is, a plain "how was your day" prompt when there isn't (no streak
// yet, or it's someone's first day). Cancels itself outright once today is
// already checked in — nothing left to warn about.
export async function scheduleCheckInReminder(streak: number, checkedInToday: boolean): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  if (checkedInToday) {
    await Notifications.cancelScheduledNotificationAsync(CHECKIN_REMINDER_ID).catch(() => {});
    return;
  }

  const { title, body } =
    streak > 0
      ? { title: 'Ta série va s’éteindre', body: `Il te reste 2h pour protéger tes ${streak} jour${streak === 1 ? '' : 's'} d'affilée.` }
      : { title: 'Comment s’est passée ta journée ?', body: 'Où en est ta batterie ?' };

  await ensureChannel();
  await Notifications.cancelScheduledNotificationAsync(CHECKIN_REMINDER_ID).catch(() => {});

  await Notifications.scheduleNotificationAsync({
    identifier: CHECKIN_REMINDER_ID,
    content: { title, body, data: { checkin: true } },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: CHECKIN_REMINDER_HOUR,
      minute: 0,
      channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
    },
  });
}
