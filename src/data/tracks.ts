/**
 * Track data. The `Track` shape mirrors the `tracks` table in Supabase
 * (supabase/migrations). The placeholders below are used until Supabase is connected.
 */

export const ARTIST_NAME = 'Pastor Edgar';

export const CATEGORIES = [
  { id: 'prayer', label: 'Prayer' },
  { id: 'meditation', label: 'Meditation' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'scripture', label: 'Scripture' },
  { id: 'focus', label: 'Focus' },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'];

export type Track = {
  id: string;
  /** Short readable name used in links, e.g. /player/still-waters */
  slug: string;
  title: string;
  description: string;
  category: CategoryId;
  duration_seconds: number;
  /** Path inside the private Supabase audio bucket (null until uploaded). */
  audio_path: string | null;
  /** Path to a cover image; when null we draw a soft gradient instead. */
  cover_path: string | null;
  is_free: boolean;
  sort_order: number;
  published: boolean;
};

export const PLACEHOLDER_TRACKS: Track[] = [
  {
    id: 'morning-peace',
    slug: 'morning-peace',
    title: 'Morning Peace',
    description: 'A gentle beginning to the day.',
    category: 'prayer',
    duration_seconds: 82,
    audio_path: null, // plays the bundled clip in assets/audio
    cover_path: null,
    is_free: true,
    sort_order: 1,
    published: true,
  },
  {
    id: 'in-his-presence',
    slug: 'in-his-presence',
    title: 'In His Presence',
    description: 'Slow, open chords for worship and stillness.',
    category: 'meditation',
    duration_seconds: 84,
    audio_path: null, // plays the bundled clip in assets/audio
    cover_path: null,
    is_free: true,
    sort_order: 2,
    published: true,
  },
  {
    id: 'still-waters',
    slug: 'still-waters',
    title: 'Still Waters',
    description: 'He leads me beside still waters. Psalm 23',
    category: 'scripture',
    duration_seconds: 82,
    audio_path: null, // plays the bundled clip in assets/audio
    cover_path: null,
    is_free: false,
    sort_order: 3,
    published: true,
  },
  {
    id: 'rest',
    slug: 'rest',
    title: 'Rest',
    description: 'Soft and unhurried, for falling asleep.',
    category: 'sleep',
    duration_seconds: 88,
    audio_path: null, // plays the bundled clip in assets/audio
    cover_path: null,
    is_free: false,
    sort_order: 4,
    published: true,
  },
  {
    id: 'secret-place',
    slug: 'secret-place',
    title: 'Secret Place',
    description: 'Quiet time alone with God.',
    category: 'focus',
    duration_seconds: 84,
    audio_path: null, // plays the bundled clip in assets/audio
    cover_path: null,
    is_free: false,
    sort_order: 5,
    published: true,
  },
];

export function categoryLabel(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
