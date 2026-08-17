import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const KEY = 'recharj.onboarding_seen';

type OnboardingContextValue = {
  seen: boolean | null; // null while the AsyncStorage read is in flight
  markSeen: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [seen, setSeen] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((value) => setSeen(value === 'true'));
  }, []);

  const markSeen = async () => {
    await AsyncStorage.setItem(KEY, 'true');
    setSeen(true);
  };

  return <OnboardingContext.Provider value={{ seen, markSeen }}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}
