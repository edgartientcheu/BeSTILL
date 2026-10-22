import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * The Supabase connection, or `null` until `.env` is filled in.
 * Without it the app still runs, using the bundled placeholder tracks and on-device favourites.
 */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: Platform.OS === 'web', // finishes "Continue with Google" after the redirect
          flowType: 'pkce',
        },
      })
    : null;

/** Reads the friendly `{ error }` message an Edge Function sent back, if any. */
export async function functionError(error: unknown, fallback: string): Promise<string> {
  const response = (error as { context?: Response } | null)?.context;
  if (response && typeof response.json === 'function') {
    const body = await response.json().catch(() => null);
    if (body?.error) return body.error;
  }
  return fallback;
}

/** Public web address of a cover image stored in the "covers" bucket. */
export function coverUrl(path: string | null): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return supabase ? supabase.storage.from('covers').getPublicUrl(path).data.publicUrl : null;
}
