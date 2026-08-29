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

// Called once, right after the user grants notification permission on the
// onboarding NOTIFICATIONS step (app/(auth)/index.tsx). Schedules a daily
// local reminder at the hour matching their MOMENT answer — the one thing
// that screen actually promised. Onboarding only ever calls this once per
// account, so clearing every scheduled notification first keeps it
// idempotent without needing to track an identifier across app restarts.
export async function scheduleLowBatteryReminder(momentLabel: string): Promise<void> {
  const hour = MOMENT_HOURS[momentLabel] ?? MOMENT_HOURS['Le soir'];

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Rappel de batterie sociale',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Grosse baisse en vue',
      body: `Ta batterie sera basse ${momentLabel.toLowerCase()}. Découvre comment t'y préparer.`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
      channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
    },
  });
}
