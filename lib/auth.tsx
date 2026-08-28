import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  };

  const signUp: AuthContextValue['signUp'] = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
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
