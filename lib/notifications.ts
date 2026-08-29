import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'battery-reminder';

// Matches lib/momentOfDay.ts's MOMENT_OPTIONS labels. An unrecognized label
// (shouldn't happen — it's always one of these four) falls back to evening.
const MOMENT_HOURS: Record<string, number> = {
  'Le matin': 8,
  "L'après-midi": 14,
  'Le soir': 19,
  'La nuit': 22,
};

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

// Reschedules the single daily reminder with content reflecting the user's
// actual state right now — a hard event to prepare for, a real battery dip,
// or (when neither applies) a nudge toward the next course they haven't
// tried. Called once during onboarding (with a forced low-battery context,
// matching what the permission screen promised) and again every time the
// Dashboard has fresh data, so the notification a user gets tonight reflects
// today, not whatever was true when they signed up. No-ops silently if
// permission was never granted or was later revoked — never re-prompts.
export async function scheduleDailyReminder(ctx: ReminderContext): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  const hour = MOMENT_HOURS[ctx.momentLabel] ?? MOMENT_HOURS['Le soir'];
  const { title, body, courseId } = contentFor(ctx);

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Rappel de batterie sociale',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  // Only one of these is ever meant to be live at a time — clearing first
  // keeps this idempotent without needing to track an identifier across
  // app restarts.
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: courseId ? { courseId } : undefined },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
      channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
    },
  });
}
