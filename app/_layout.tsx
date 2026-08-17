import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
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
    <ThemeProvider value={navTheme}>
      <StatusBar style="light" />
      <AuthProvider>
        <OnboardingProvider>
          <RootNavigator />
        </OnboardingProvider>
      </AuthProvider>
    </ThemeProvider>
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
      {/* Available to any signed-in user regardless of onboarding-seen state,
          so the redirect from app/onboarding.tsx into a course never races
          against the seen flag settling. */}
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="add-event" options={{ presentation: 'modal' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
        <Stack.Screen name="course/[id]" />
        <Stack.Screen name="source/[id]" options={{ presentation: 'modal' }} />

        <Stack.Protected guard={seen === true}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        <Stack.Protected guard={seen === false}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
