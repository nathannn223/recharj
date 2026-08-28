import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const KEY = 'recharj.onboarding_seen';

type OnboardingContextValue = {
  seen: boolean | null; // null while the AsyncStorage read is in flight
  markSeen: () => Promise<void>;
  // Dev-only. The __DEV__ override below only fires once, on the provider's
  // initial mount, so it does not catch a second test signup made later in
  // the same running session (sign out, sign up again, no app restart) —
  // `seen` stays true from the first account and onboarding gets skipped.
  // Call this right after a fresh signUp() succeeds to reset it. No-op in
  // production.
  resetSeen: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [seen, setSeen] = useState<boolean | null>(null);

  useEffect(() => {
    // Dev builds always re-show onboarding on reload instead of reading the
    // persisted flag, so it can be iterated on without clearing storage or
    // recreating an account each time. markSeen() still works normally
    // within a session (e.g. the dev skip button) — this only overrides
    // what happens on a fresh mount. Never runs in production (__DEV__).
    if (__DEV__) {
      setSeen(false);
      return;
    }
    AsyncStorage.getItem(KEY).then((value) => setSeen(value === 'true'));
  }, []);

  const markSeen = async () => {
    await AsyncStorage.setItem(KEY, 'true');
    setSeen(true);
  };

  const resetSeen = () => {
    if (__DEV__) setSeen(false);
  };

  return <OnboardingContext.Provider value={{ seen, markSeen, resetSeen }}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}
