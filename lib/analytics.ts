import PostHog from 'posthog-react-native';

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST;

// A single shared instance rather than relying only on <PostHogProvider>'s
// internally-created client: this one also needs to be reachable from
// plain (non-component) code — lib/auth.tsx's identify()/reset() calls —
// and passing it to PostHogProvider via its `client` prop still gives every
// component access through usePostHog(). Missing credentials disable
// capture instead of throwing (unlike lib/supabase.ts) — analytics failing
// to init should never take the app down with it.
export const posthog = new PostHog(apiKey ?? 'phc_disabled_missing_env_key', {
  host: host ?? 'https://eu.i.posthog.com',
});
if (!apiKey || !host) posthog.optOut();

// Every event name this app fires, in one place, so a PostHog funnel/insight
// built from a string never silently drifts out of sync with a typo'd
// literal somewhere in the app. Grouped by the part of the funnel they
// belong to — see JOURNAL-TRAVAUX.md for the full dashboard spec.
export const AnalyticsEvent = {
  // Pre-signup quiz (app/(auth)/index.tsx). Viewed (a step becomes active,
  // covers the very first HOOK screen too — this doubles as "onboarding
  // started") is distinct from Completed (the user answered/read it and
  // tapped through) so a funnel can tell "nobody read this screen" apart
  // from "people read it but bounced without continuing".
  OnboardingStepViewed: 'onboarding_step_viewed',
  OnboardingStepCompleted: 'onboarding_step_completed',
  OnboardingStepBack: 'onboarding_step_back',
  NotificationPermissionResult: 'notification_permission_result',
  SignupSubmitted: 'signup_submitted',
  SignupFailed: 'signup_failed',
  EmailConfirmationShown: 'email_confirmation_shown',
  EmailConfirmed: 'email_confirmed',
  // Post-signup (app/onboarding.tsx)
  OnboardingCompleted: 'onboarding_completed',
  // Monetization — same event names from both the in-onboarding trial step
  // and the standalone app/paywall.tsx modal, distinguished by `source`.
  PaywallViewed: 'paywall_viewed',
  PlanSelected: 'plan_selected',
  PlanConfirmed: 'plan_confirmed',
  RestorePurchasesTapped: 'restore_purchases_tapped',
  // Courses
  CourseLockedHit: 'course_locked_hit',
  CourseStarted: 'course_started',
  CourseStepViewed: 'course_step_viewed',
  CourseCardFlipped: 'course_card_flipped',
  CourseCompleted: 'course_completed',
  CourseRated: 'course_rated',
  // Core retention loop
  EventAdded: 'event_added',
  EventUpdated: 'event_updated',
  CheckinCompleted: 'checkin_completed',
  StreakBadgeTapped: 'streak_badge_tapped',
  // Account
  LanguageChanged: 'language_changed',
  AccountDeleted: 'account_deleted',
} as const;

// Mirrors the STEP order in app/(auth)/index.tsx exactly (minus
// CHECK_EMAIL, which isn't a funnel step the user chose to advance past).
// Index in this array doubles as `step_index` on OnboardingStepCompleted.
export const ONBOARDING_STEPS = [
  'hook',
  'name',
  'diagnostic',
  'pain',
  'obstacle',
  'frequency',
  'recharge',
  'anticipation',
  'moment',
  'authority',
  'features',
  'streak_demo',
  'notifications',
  'unique',
  'contract',
  'recap',
  'trial',
  'signup_form',
] as const;
