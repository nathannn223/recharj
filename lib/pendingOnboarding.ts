import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'recharj.pending_onboarding';

// Every *_id/*Id field is a stable id from lib/painTypes.ts, lib/obstacles.ts,
// lib/socialProfile.ts or lib/momentOfDay.ts — never the display label, so
// what's persisted to `profiles` never changes when the app's language does.
export type PendingOnboarding = {
  firstName: string;
  baselineScore: number;
  painId: string;
  obstacleIds: string[];
  eventFrequencyId: string;
  rechargeId: string;
  anticipationId: string;
  momentId: string;
};

// Bridges the pre-signup quiz (no session yet) to the moment a session
// finally exists. Written right before calling signUp so it survives even
// if Supabase requires email confirmation and the app gets closed in the
// meantime — app/onboarding.tsx applies it to `profiles` once a session
// shows up, however long that takes.
export async function savePendingOnboarding(data: PendingOnboarding): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}

export async function readAndClearPendingOnboarding(): Promise<PendingOnboarding | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  await AsyncStorage.removeItem(KEY);
  try {
    return JSON.parse(raw) as PendingOnboarding;
  } catch {
    return null;
  }
}
