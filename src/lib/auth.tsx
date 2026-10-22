import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

export type SubscriptionStatus = 'none' | 'trialing' | 'active' | 'past_due' | 'canceled';

export type Profile = {
  subscription_status: SubscriptionStatus;
  current_period_end: string | null;
  /** The owner: can open the upload page and hear everything. Set only from the SQL Editor. */
  is_admin: boolean;
};

type AuthContextValue = {
  /** False until we know whether someone is signed in. */
  ready: boolean;
  configured: boolean;
  user: User | null;
  profile: Profile | null;
  /** Re-reads plan status (e.g. after returning from checkout). */
  refreshProfile: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  /** Resolves to true when Supabase wants the email confirmed before first sign-in. */
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function client() {
  if (!supabase) throw new Error('Accounts are not set up yet. Add the Supabase keys to .env (see README).');
  return supabase;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  // The profile is remembered together with whose it is, so a stale one is never shown after sign-out.
  const [loaded, setLoaded] = useState<{ userId: string; profile: Profile } | null>(null);
  const [ready, setReady] = useState(!supabase);
  const userId = session?.user.id;

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const [profileVersion, setProfileVersion] = useState(0);

  useEffect(() => {
    if (!supabase || !userId) return;
    let cancelled = false;
    supabase
      .from('profiles')
      .select('subscription_status, current_period_end, is_admin')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const fallback: Profile = { subscription_status: 'none', current_period_end: null, is_admin: false };
        setLoaded({ userId, profile: (data as Profile | null) ?? fallback });
      });
    return () => {
      cancelled = true;
    };
  }, [userId, profileVersion]);

  const profile = userId && loaded?.userId === userId ? loaded.profile : null;

  const value: AuthContextValue = {
    ready,
    configured: !!supabase,
    user: session?.user ?? null,
    profile,
    refreshProfile: () => setProfileVersion((v) => v + 1),
    async signIn(email, password) {
      const { error } = await client().auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error(friendly(error.message));
    },
    async signUp(email, password) {
      const { data, error } = await client().auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: Platform.OS === 'web' ? window.location.origin : undefined },
      });
      if (error) throw new Error(friendly(error.message));
      return { needsConfirmation: !data.session };
    },
    async signInWithGoogle() {
      if (Platform.OS !== 'web') {
        // Phase 2: native Google sign-in (expo-auth-session / expo-web-browser).
        throw new Error('Google sign-in is coming to the phone app soon. Please use email for now.');
      }
      const { error } = await client().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/account` },
      });
      if (error) throw new Error(friendly(error.message));
    },
    async signOut() {
      await client().auth.signOut();
    },
    async deleteAccount() {
      const { error } = await client().rpc('delete_my_account');
      if (error) throw new Error('We could not delete your account. Please try again.');
      await client().auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Turns Supabase's technical messages into calm, plain ones. */
function friendly(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'That email and password don’t match. Please try again.';
  if (/email not confirmed/i.test(message)) return 'Please confirm your email first. Check your inbox for our link.';
  if (/already registered/i.test(message)) return 'An account with this email already exists. Try signing in.';
  if (/password should be/i.test(message)) return 'Please choose a password with at least 8 characters.';
  if (/provider is not enabled/i.test(message))
    return 'Google sign-in isn’t switched on yet. Please use email for now.';
  if (/rate limit/i.test(message)) return 'Too many attempts. Please wait a minute and try again.';
  return message;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
