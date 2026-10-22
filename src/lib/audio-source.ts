import type { AudioSource } from 'expo-audio';

import type { Track } from '@/data/tracks';
import { supabase } from '@/lib/supabase';

/**
 * Short synthesized piano sketches bundled with the app so the player can be tested
 * before real recordings are uploaded. They are NOT Pastor Edgar's music.
 */
const PLACEHOLDER_AUDIO: Record<string, number> = {
  'morning-peace': require('@/assets/audio/morning-peace.mp3'),
  'in-his-presence': require('@/assets/audio/in-his-presence.mp3'),
  'still-waters': require('@/assets/audio/still-waters.mp3'),
  rest: require('@/assets/audio/rest.mp3'),
  'secret-place': require('@/assets/audio/secret-place.mp3'),
};

/**
 * Turns a track into something the audio player can stream.
 *
 * Uploaded recordings live in the PRIVATE "audio" bucket. The `get-audio-url` Edge Function
 * checks the listener may hear this track (free, or an active subscriber) and returns a
 * short-lived signed link. Nothing in the app ever holds a permanent link to paid audio.
 */
export async function resolveAudioSource(track: Track): Promise<AudioSource> {
  if (track.audio_path && supabase) {
    const { data, error } = await supabase.functions.invoke<{ url: string }>('get-audio-url', {
      body: { track_id: track.id },
    });
    if (error || !data?.url) throw new Error(await explain(error));
    return { uri: data.url };
  }
  const bundled = PLACEHOLDER_AUDIO[track.slug];
  if (bundled) return bundled;
  throw new Error('This recording is not available yet.');
}

/** Reads the friendly message the Edge Function sends back, if any. */
async function explain(error: unknown): Promise<string> {
  const response = (error as { context?: Response } | null)?.context;
  if (response && typeof response.json === 'function') {
    const body = await response.json().catch(() => null);
    if (body?.error) return body.error;
  }
  return 'This track could not be loaded. Please check your connection and try again.';
}
