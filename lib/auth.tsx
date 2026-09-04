import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { AnalyticsEvent, posthog } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  // `hasSession` is false when Supabase requires email confirmation before
  // issuing a session — callers use it to show a "check your email" state.
  signUp: (email: string, password: string) => Promise<{ error: string | null; hasSession: boolean }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Tracks which user id PostHog was last identified as, so a token refresh
  // (onAuthStateChange fires on those too, not just sign-in) doesn't
  // re-send an identify call for a user it already knows about.
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    const syncIdentity = (newSession: Session | null) => {
      if (newSession && identifiedUserId.current !== newSession.user.id) {
        identifiedUserId.current = newSession.user.id;
        posthog.identify(newSession.user.id, { email: newSession.user.email ?? null });
      } else if (!newSession && identifiedUserId.current) {
        identifiedUserId.current = null;
        posthog.reset();
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      syncIdentity(data.session);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      syncIdentity(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  };

  const signUp: AuthContextValue['signUp'] = async (email, password) => {
    // emailRedirectTo sends the confirmation link back into the app itself
    // (via the `recharj://` scheme, handled in app/_layout.tsx) instead of
    // leaving the user to open their mail client, confirm, then come back
    // and manually type their password again — the deep link finishes
    // signing them in on its own.
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: 'recharj://confirm' } });
    return { error: error ? error.message : null, hasSession: !!data.session };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Runs server-side (see supabase/functions/delete-account) because
  // deleting an auth user requires the service_role key, which the client
  // must never hold. Signs the session out locally afterward so the app
  // doesn't keep referencing a user that no longer exists.
  const deleteAccount: AuthContextValue['deleteAccount'] = async () => {
    const { error } = await supabase.functions.invoke('delete-account');
    if (error) return { error: error.message };
    // Captured before signOut()'s onAuthStateChange fires posthog.reset()
    // above — after that the session is anonymized and this event would no
    // longer attach to the person who actually deleted their account.
    posthog.capture(AnalyticsEvent.AccountDeleted);
    await supabase.auth.signOut();
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signUp, signOut, deleteAccount }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
