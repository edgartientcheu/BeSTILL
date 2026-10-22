import type { AudioSource } from 'expo-audio';

import type { Track } from '@/data/tracks';

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
 * Step 3 replaces the body with a call to a Supabase Edge Function that checks the
 * listener's access and returns a short-lived signed URL. Callers already await it.
 */
export async function resolveAudioSource(track: Track): Promise<AudioSource> {
  const bundled = PLACEHOLDER_AUDIO[track.id];
  if (bundled) return bundled;
  throw new Error('This recording is not available yet.');
}
