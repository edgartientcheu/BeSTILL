import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { PLACEHOLDER_TRACKS, type CategoryId, type Track } from '@/data/tracks';
import { supabase } from '@/lib/supabase';

type LibraryContextValue = {
  tracks: Track[];
  loading: boolean;
  error: string | null;
  reload: () => void;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

const COLUMNS =
  'id, slug, title, description, category, duration_seconds, audio_path, cover_path, is_free, sort_order, published';

/** Loads the published tracks once (from Supabase, or the built-in placeholders when it isn't set up). */
export function LibraryProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>(supabase ? [] : PLACEHOLDER_TRACKS);
  const [loading, setLoading] = useState(!!supabase);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    supabase
      .from('tracks')
      .select(COLUMNS)
      .eq('published', true)
      .order('sort_order')
      .then(({ data, error: e }) => {
        if (cancelled) return;
        if (e) setError('We couldn’t reach the music library. Please check your connection.');
        else {
          setTracks((data ?? []) as Track[]);
          setError(null);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const reload = () => {
    setLoading(true);
    setAttempt((n) => n + 1);
  };

  return <LibraryContext.Provider value={{ tracks, loading, error, reload }}>{children}</LibraryContext.Provider>;
}

export function useLibrary(category?: CategoryId) {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used inside <LibraryProvider>');
  return {
    ...ctx,
    tracks: category ? ctx.tracks.filter((t) => t.category === category) : ctx.tracks,
    bySlug: (slug: string) => ctx.tracks.find((t) => t.slug === slug),
    byId: (id: string) => ctx.tracks.find((t) => t.id === id || t.slug === id),
  };
}
