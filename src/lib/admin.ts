import type { CategoryId, Track } from '@/data/tracks';
import { supabase } from '@/lib/supabase';

/**
 * The owner's library tools. Everything here runs with the owner's own sign-in;
 * the database only allows it because their profile has is_admin = true.
 */

/** Supabase's free plan accepts files up to 50 MB. */
export const MAX_AUDIO_MB = 50;
const MAX_COVER_MB = 5;

const AUDIO_TYPES: Record<string, string> = { mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac' };
const IMAGE_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function db() {
  if (!supabase) throw new Error('Supabase is not connected.');
  return supabase;
}

const extension = (file: File) => file.name.split('.').pop()?.toLowerCase() ?? '';

/**
 * Browsers sometimes report no type (or an odd one) for M4A files, and Supabase uploads use the
 * file's own type, so we re-label it from the extension. The buckets only accept audio/images.
 */
const typed = (file: File, type: string) => new Blob([file], { type });

/** "In His Presence (Live)" → "in-his-presence-live" */
export function slugify(title: string): string {
  return (
    title
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'track'
  );
}

export function uniqueSlug(title: string, taken: string[]): string {
  const base = slugify(title);
  let slug = base;
  for (let n = 2; taken.includes(slug); n++) slug = `${base}-${n}`;
  return slug;
}

/** Reads how long a recording is, straight from the file, before uploading. */
export function readDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    const done = (seconds: number) => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(seconds) ? Math.round(seconds) : 0);
    };
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => done(audio.duration);
    audio.onerror = () => done(0);
    audio.src = url;
  });
}

/** Returns a plain-language problem with the chosen files, or null if they're fine. */
export function checkFiles(audio: File | null, cover: File | null): string | null {
  if (!audio) return 'Please choose the recording (MP3 or M4A).';
  if (!AUDIO_TYPES[extension(audio)]) return 'The recording must be an MP3 or M4A file.';
  if (audio.size > MAX_AUDIO_MB * 1024 * 1024) {
    return `The recording is larger than ${MAX_AUDIO_MB} MB. Please export it as an MP3 at 192 kbps, which is plenty for piano.`;
  }
  if (cover && !IMAGE_TYPES[extension(cover)]) return 'The cover must be a JPG, PNG or WEBP image.';
  if (cover && cover.size > MAX_COVER_MB * 1024 * 1024) return `The cover image is larger than ${MAX_COVER_MB} MB.`;
  return null;
}

export async function listAllTracks(): Promise<Track[]> {
  const { data, error } = await db().from('tracks').select('*').order('sort_order');
  if (error) throw new Error('Could not load the library.');
  return data as Track[];
}

export type NewTrack = {
  title: string;
  description: string;
  category: CategoryId;
  isFree: boolean;
  publish: boolean;
  audio: File;
  cover: File | null;
};

export async function uploadTrack(input: NewTrack, existing: Track[]): Promise<Track> {
  const client = db();
  const slug = uniqueSlug(
    input.title,
    existing.map((t) => t.slug),
  );
  const stamp = Date.now();
  const audioExt = extension(input.audio);
  const audioPath = `${slug}-${stamp}.${audioExt}`;
  const coverPath = input.cover ? `${slug}-${stamp}.${extension(input.cover)}` : null;
  const duration = await readDuration(input.audio);

  const uploaded: { bucket: string; path: string }[] = [];
  const cleanUp = () => Promise.all(uploaded.map((f) => client.storage.from(f.bucket).remove([f.path])));

  try {
    const audio = await client.storage.from('audio').upload(audioPath, typed(input.audio, AUDIO_TYPES[audioExt]));
    if (audio.error)
      throw new Error('The recording could not be uploaded. Please check your connection and try again.');
    uploaded.push({ bucket: 'audio', path: audioPath });

    if (input.cover && coverPath) {
      const cover = await client.storage
        .from('covers')
        .upload(coverPath, typed(input.cover, IMAGE_TYPES[extension(input.cover)]));
      if (cover.error) throw new Error('The cover image could not be uploaded.');
      uploaded.push({ bucket: 'covers', path: coverPath });
    }

    const { data, error } = await client
      .from('tracks')
      .insert({
        slug,
        title: input.title.trim(),
        description: input.description.trim(),
        category: input.category,
        duration_seconds: duration,
        audio_path: audioPath,
        cover_path: coverPath,
        is_free: input.isFree,
        published: input.publish,
        sort_order: Math.max(0, ...existing.map((t) => t.sort_order)) + 1,
      })
      .select('*')
      .single();
    if (error) throw new Error('The track details could not be saved.');
    return data as Track;
  } catch (e) {
    await cleanUp(); // don't leave orphan files behind
    throw e;
  }
}

export async function updateTrack(id: string, changes: Partial<Pick<Track, 'published' | 'is_free'>>) {
  const { error } = await db().from('tracks').update(changes).eq('id', id);
  if (error) throw new Error('The change could not be saved.');
}

export async function deleteTrack(track: Track) {
  const client = db();
  const { error } = await client.from('tracks').delete().eq('id', track.id);
  if (error) throw new Error('The track could not be deleted.');
  if (track.audio_path) await client.storage.from('audio').remove([track.audio_path]);
  if (track.cover_path) await client.storage.from('covers').remove([track.cover_path]);
}
