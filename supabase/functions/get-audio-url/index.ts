// BE STILL: hands out a short-lived link to one recording.
//
// Free tracks: anyone. Paid tracks: only signed-in people with an active subscription.
// Audio files stay in the PRIVATE "audio" bucket; the link expires, so it can't be shared for long.
//
// Deploy: Supabase Dashboard → Edge Functions → Deploy a new function → Via Editor,
// name it `get-audio-url`, paste this file, and turn OFF "Verify JWT" (this code checks sign-in itself).

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return reply(405, { error: 'Method not allowed' });

  let trackId: unknown;
  try {
    ({ track_id: trackId } = await req.json());
  } catch {
    return reply(400, { error: 'Invalid request' });
  }
  if (typeof trackId !== 'string' || !/^[0-9a-f-]{36}$/i.test(trackId)) {
    return reply(400, { error: 'Missing track' });
  }

  // Server-side client: bypasses Row Level Security, so every check below matters.
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  const { data: track, error } = await admin
    .from('tracks')
    .select('id, audio_path, is_free, published, duration_seconds')
    .eq('id', trackId)
    .maybeSingle();
  if (error) return reply(500, { error: 'Could not load track' });
  if (!track || !track.published || !track.audio_path) return reply(404, { error: 'Track not found' });

  if (!track.is_free) {
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    const { data: auth } = token ? await admin.auth.getUser(token) : { data: { user: null } };
    if (!auth.user) return reply(401, { error: 'Please sign in to listen.' });

    const { data: subscribed, error: subError } = await admin.rpc('has_active_subscription', {
      uid: auth.user.id,
    });
    if (subError) return reply(500, { error: 'Could not check subscription' });
    if (!subscribed) return reply(403, { error: 'This track is for subscribers.' });
  }

  // Long enough to finish the track (and seek around in it), short enough to be useless if shared.
  const expiresIn = Math.max(30 * 60, track.duration_seconds + 30 * 60);
  const { data: signed, error: signError } = await admin.storage
    .from('audio')
    .createSignedUrl(track.audio_path, expiresIn);
  if (signError || !signed) return reply(500, { error: 'Could not prepare audio' });

  return reply(200, { url: signed.signedUrl, expires_in: expiresIn });
});
