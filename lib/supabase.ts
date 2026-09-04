import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in your Supabase project values.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // AsyncStorage's web implementation touches `window` directly, which
    // crashes during Expo Router's web SSR pass (no DOM in that Node
    // process). On web, omit it so supabase-js falls back to its own
    // SSR-safe localStorage handling; native platforms keep AsyncStorage.
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // PKCE (rather than the implicit-flow default) puts the confirmation
    // link's payload in a plain `?code=` query param instead of a
    // `#access_token=...` URL fragment — the fragment form is awkward to
    // parse out of a native deep link and briefly exposes the tokens
    // themselves in the URL. exchangeCodeForSession() in app/_layout.tsx
    // relies on this being 'pkce'.
    flowType: 'pkce',
  },
});
