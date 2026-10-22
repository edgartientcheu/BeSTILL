// BE STILL: starts a Stripe Checkout for the monthly or yearly plan.
//
// Signed-in people only. First-time subscribers get a 7-day free trial.
// Deploy like get-audio-url (Dashboard → Edge Functions → Via Editor), name it
// `create-checkout-session`, and turn OFF "Verify JWT" (this code checks sign-in itself).
//
// Needs these Edge Function secrets: STRIPE_SECRET_KEY, STRIPE_PRICE_MONTHLY,
// STRIPE_PRICE_YEARLY, SITE_URL (comma-separated list of the app's web addresses).

import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@23.0.0';

const TRIAL_DAYS = 7;

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

/** Sends people back to the address they came from, but only if it's one of ours. */
function siteUrl(req: Request): string {
  const allowed = (Deno.env.get('SITE_URL') ?? 'http://localhost:8081').split(',').map((s) => s.trim().replace(/\/$/, ''));
  const origin = req.headers.get('origin')?.replace(/\/$/, '');
  return origin && allowed.includes(origin) ? origin : allowed[0];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return reply(405, { error: 'Method not allowed' });

  const { plan } = await req.json().catch(() => ({ plan: null }));
  const price = plan === 'monthly' ? Deno.env.get('STRIPE_PRICE_MONTHLY') : plan === 'yearly' ? Deno.env.get('STRIPE_PRICE_YEARLY') : null;
  if (!price) return reply(400, { error: 'Please choose a plan.' });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  const { data: auth } = token ? await admin.auth.getUser(token) : { data: { user: null } };
  const user = auth.user;
  if (!user) return reply(401, { error: 'Please sign in first.' });

  const { data: subscribed } = await admin.rpc('has_active_subscription', { uid: user.id });
  if (subscribed) return reply(409, { error: 'You already have the full library.' });

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { httpClient: Stripe.createFetchHttpClient() });

  try {
    // One Stripe customer per account, remembered in profiles.stripe_customer_id.
    const { data: profile } = await admin.from('profiles').select('stripe_customer_id').eq('user_id', user.id).single();
    let customer = profile?.stripe_customer_id as string | null;
    if (!customer) {
      const created = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } });
      customer = created.id;
      await admin.from('profiles').update({ stripe_customer_id: customer }).eq('user_id', user.id);
    }

    // The free trial is for first-time subscribers only.
    const previous = await stripe.subscriptions.list({ customer, status: 'all', limit: 1 });
    const firstTime = previous.data.length === 0;

    const site = siteUrl(req);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer,
      client_reference_id: user.id,
      line_items: [{ price, quantity: 1 }],
      subscription_data: {
        metadata: { user_id: user.id },
        ...(firstTime ? { trial_period_days: TRIAL_DAYS } : {}),
      },
      allow_promotion_codes: true,
      success_url: `${site}/account?checkout=success`,
      cancel_url: `${site}/paywall`,
    });
    return reply(200, { url: session.url });
  } catch (e) {
    console.error('checkout failed', e);
    return reply(500, { error: 'We couldn’t open the payment page. Please try again.' });
  }
});
