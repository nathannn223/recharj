import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { PostHogProvider } from 'posthog-react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { posthog, AnalyticsEvent } from '@/lib/analytics';
import { colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/lib/auth';
import i18n, { loadLanguageOverride } from '@/lib/i18n';
import { OnboardingProvider, useOnboarding } from '@/lib/onboarding';
import { supabase } from '@/lib/supabase';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

// Governs how the daily low-battery reminder (lib/notifications.ts) behaves
// if it fires while the app is already open — shown as a normal banner
// instead of being silently swallowed, which is expo-notifications' default
// foreground behavior without an explicit handler.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.lime,
    background: colors.ink,
    card: colors.surface,
    text: colors.text,
    border: colors.borderSoft,
    notification: colors.coral,
  },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [languageReady, setLanguageReady] = useState(false);

  useEffect(() => {
    loadLanguageOverride().finally(() => {
      // A super property (not a per-event one) so every event fired from
      // here on — across every screen, without touching each capture() call
      // individually — carries the active app language. Re-registered from
      // app/(tabs)/profile.tsx too when the user changes it mid-session.
      posthog.register({ app_language: i18n.language });
      setLanguageReady(true);
    });
  }, []);

  if (!fontsLoaded || !languageReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <PostHogProvider client={posthog}>
        <ThemeProvider value={navTheme}>
          <StatusBar style="light" />
          <AuthProvider>
            <OnboardingProvider>
              <RootNavigator />
            </OnboardingProvider>
          </AuthProvider>
        </ThemeProvider>
      </PostHogProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { session, loading } = useAuth();
  const { seen } = useOnboarding();

  // While signed in, also wait on the (fast, local) onboarding-seen read
  // before picking a branch, so a signed-in user never flashes onboarding
  // then instantly redirects to the tabs (or vice versa).
  const stillResolving = loading || (!!session && seen === null);

  useEffect(() => {
    if (!stillResolving) {
      SplashScreen.hideAsync();
    }
  }, [stillResolving]);

  // Tapping the daily reminder should land on the specific course it
  // mentioned (lib/notifications.ts sets data.courseId whenever the
  // content names one), not just open the app to wherever it was.
  // Covers both a tap while the app is already running and a cold start
  // from a tap (the notification that launched the app is only available
  // via getLastNotificationResponseAsync, not the listener below).
  useEffect(() => {
    const openFromNotification = (data: Record<string, unknown> | undefined) => {
      if (!data) return;
      if (typeof data.courseId === 'string') router.push(`/course/${data.courseId}`);
      else if (data.checkin === true) router.push('/checkin');
    };
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      openFromNotification(response.notification.request.content.data);
    });
    Notifications.getLastNotificationResponseAsync().then((response) => {
      openFromNotification(response?.notification.request.content.data);
    });
    return () => subscription.remove();
  }, []);

  // Finishes the email-confirmation flow started in lib/auth.tsx's signUp()
  // (emailRedirectTo: 'recharj://confirm'): the confirmation link opens the
  // app directly with a PKCE `?code=` param instead of dropping the user
  // back at a browser tab, and exchanging it here signs them in without
  // ever having to type their password again. Silently ignores URLs that
  // aren't a confirmation link (or a code that's already been used/expired)
  // — the user can always fall back to signing in manually. Covers both a
  // tap while the app is already running and a cold start from a tap, same
  // getInitialURL()-plus-listener split as the notification handler above.
  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return;
      const code = Linking.parse(url).queryParams?.code;
      if (typeof code !== 'string') return;
      supabase.auth
        .exchangeCodeForSession(code)
        .then(() => posthog.capture(AnalyticsEvent.EmailConfirmed))
        .catch(() => {});
    };
    const subscription = Linking.addEventListener('url', (event) => handleUrl(event.url));
    Linking.getInitialURL().then(handleUrl);
    return () => subscription.remove();
  }, []);

  if (stillResolving) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        {/* Declared first so Expo Router treats one of these as the default
            route for "/" — otherwise the first Stack.Screen anywhere in this
            group wins that role, which was silently landing everyone on
            add-event (a modal with no back history, hence "stuck"). */}
        <Stack.Protected guard={seen === true}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={seen === false}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>

        {/* Available to any signed-in user regardless of onboarding-seen
            state, so the redirect from app/onboarding.tsx into a course
            never races against the seen flag settling. */}
        <Stack.Screen name="add-event" options={{ presentation: 'modal' }} />
        <Stack.Screen name="checkin" options={{ presentation: 'modal' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
        <Stack.Screen name="course/[id]" />
        <Stack.Screen name="source/[id]" options={{ presentation: 'modal' }} />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
