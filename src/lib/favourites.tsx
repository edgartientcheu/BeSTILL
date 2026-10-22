import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { useAuth } from '@/lib/auth';
import { useLibrary } from '@/lib/library';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'be-still:favourites';

type FavouritesContextValue = {
  /** Track ids, newest first. */
  ids: string[];
  isFavourite: (trackId: string) => boolean;
  toggleFavourite: (trackId: string) => void;
};

const FavouritesContext = createContext<FavouritesContextValue | null>(null);

/**
 * Signed out: favourites live on this device.
 * Signed in: they live in the `favourites` table, so they follow people to every device.
 * Hearts added before signing in are moved into the account on first sign-in.
 */
export function FavouritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { tracks } = useLibrary();
  const [ids, setIds] = useState<string[]>([]);
  const userId = user?.id;
  const libraryReady = tracks.length > 0;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local: string[] = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY).catch(() => null)) ?? '[]');
      if (!supabase || !userId) {
        if (!cancelled) setIds(local);
        return;
      }
      // Move any on-device hearts into the account (placeholders stored slugs, so map them to ids).
      const toMove = local
        .map((idOrSlug) => tracks.find((t) => t.id === idOrSlug || t.slug === idOrSlug)?.id)
        .filter((id): id is string => !!id);
      if (toMove.length) {
        const { error } = await supabase.from('favourites').upsert(
          toMove.map((track_id) => ({ user_id: userId, track_id })),
          { onConflict: 'user_id,track_id', ignoreDuplicates: true },
        );
        if (!error) await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
      }
      const { data } = await supabase
        .from('favourites')
        .select('track_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!cancelled) setIds((data ?? []).map((r) => r.track_id as string));
    })();
    return () => {
      cancelled = true;
    };
    // Re-run when someone signs in/out, or once the library has loaded (needed to map old hearts).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, libraryReady]);

  async function toggleFavourite(trackId: string) {
    const was = ids.includes(trackId);
    const next = was ? ids.filter((id) => id !== trackId) : [trackId, ...ids];
    setIds(next); // update the heart immediately; undo below if saving fails

    if (!supabase || !userId) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return;
    }
    const { error } = was
      ? await supabase.from('favourites').delete().eq('user_id', userId).eq('track_id', trackId)
      : await supabase.from('favourites').insert({ user_id: userId, track_id: trackId });
    if (error) setIds(ids);
  }

  return (
    <FavouritesContext.Provider value={{ ids, isFavourite: (id) => ids.includes(id), toggleFavourite }}>
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites(): FavouritesContextValue {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error('useFavourites must be used inside <FavouritesProvider>');
  return ctx;
}
