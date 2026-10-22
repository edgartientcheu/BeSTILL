// BE STILL: opens Stripe's Customer Portal, where subscribers can cancel, switch plan
// or update their card.
//
// Deploy via Dashboard → Edge Functions → Via Editor, name it `create-portal-session`,
// and turn OFF "Verify JWT" (this code checks sign-in itself).
// Needs Edge Function secrets: STRIPE_SECRET_KEY, SITE_URL.

import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@23.0.0';

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

function siteUrl(req: Request): string {
  const allowed = (Deno.env.get('SITE_URL') ?? 'http://localhost:8081').split(',').map((s) => s.trim().replace(/\/$/, ''));
  const origin = req.headers.get('origin')?.replace(/\/$/, '');
  return origin && allowed.includes(origin) ? origin : allowed[0];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return reply(405, { error: 'Method not allowed' });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  const { data: auth } = token ? await admin.auth.getUser(token) : { data: { user: null } };
  if (!auth.user) return reply(401, { error: 'Please sign in first.' });

  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('user_id', auth.user.id)
    .single();
  if (!profile?.stripe_customer_id) return reply(404, { error: 'No subscription found for this account.' });

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { httpClient: Stripe.createFetchHttpClient() });
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${siteUrl(req)}/account`,
    });
    return reply(200, { url: session.url });
  } catch (e) {
    console.error('portal failed', e);
    return reply(500, { error: 'We couldn’t open subscription settings. Please try again.' });
  }
});
