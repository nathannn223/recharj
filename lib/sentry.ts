import * as Sentry from '@sentry/react-native';

// Sentry.init() with an empty/undefined dsn disables the SDK without
// throwing — same reasoning as lib/analytics.ts for PostHog: a missing
// crash-reporting credential should never break the app.
//
// No session replay: this app handles onboarding answers, event
// descriptions and check-in comments — screen recordings of that content
// aren't something to turn on by default. tracesSampleRate is a light
// performance-tracing sample, not full replay.
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
});
