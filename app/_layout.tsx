import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
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

import { colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/lib/auth';
import { OnboardingProvider, useOnboarding } from '@/lib/onboarding';

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

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navTheme}>
        <StatusBar style="light" />
        <AuthProvider>
          <OnboardingProvider>
            <RootNavigator />
          </OnboardingProvider>
        </AuthProvider>
      </ThemeProvider>
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
