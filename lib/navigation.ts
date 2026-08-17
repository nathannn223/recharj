import { router } from 'expo-router';

/**
 * router.back() silently does nothing (or worse) when the current screen
 * has no history to pop to — which happens for real whenever a screen is
 * reached via router.replace() rather than push(), e.g. course/[id] right
 * after onboarding. Falls back to a known-good screen instead.
 */
export function safeBack(fallback: '/(tabs)' = '/(tabs)') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback);
  }
}
