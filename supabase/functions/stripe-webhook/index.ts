// BE STILL: Stripe tells this function whenever a subscription starts, renews, changes,
// fails to pay or ends. It keeps profiles.subscription_status / current_period_end in sync,
// which is what the app and get-audio-url use to decide access.
//
// Deploy via Dashboard → Edge Functions → Via Editor, name it `stripe-webhook`, and turn OFF
// "Verify JWT" (Stripe signs its messages instead; we check that signature below).
// Needs Edge Function secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET.

import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@23.0.0';

const cryptoProvider = Stripe.createSubtleCryptoProvider();

type AppStatus = 'none' | 'trialing' | 'active' | 'past_due' | 'canceled';

const STATUS: Record<string, AppStatus> = {
  trialing: 'trialing',
  active: 'active',
  past_due: 'past_due',
  unpaid: 'past_due',
  canceled: 'canceled',
  incomplete_expired: 'canceled',
  paused: 'canceled',
  incomplete: 'none', // first payment hasn't gone through yet
};

/** Lower is better: when someone has several subscriptions, the best one decides access. */
const RANK: Record<AppStatus, number> = { active: 0, trialing: 1, past_due: 2, canceled: 3, none: 4 };

function periodEnd(sub: Stripe.Subscription): string | null {
  const seconds =
    sub.status === 'trialing' && sub.trial_end
      ? sub.trial_end
      : Math.max(0, ...sub.items.data.map((item) => item.current_period_end ?? 0));
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

/**
 * Re-reads the customer's subscriptions from Stripe rather than trusting one event,
 * so events arriving late or out of order can never leave the wrong status behind.
 */
async function syncCustomer(stripe: Stripe, customerId: string, userIdHint?: string | null) {
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 20 });
  const best = subs.data
    .map((sub) => ({ sub, status: STATUS[sub.status] ?? 'none' }))
    .sort((a, b) => RANK[a.status] - RANK[b.status] || b.sub.created - a.sub.created)[0];

  const update = {
    subscription_status: best?.status ?? 'none',
    current_period_end: best ? periodEnd(best.sub) : null,
    updated_at: new Date().toISOString(),
  };

  const { data: rows, error } = await admin
    .from('profiles')
    .update(update)
    .eq('stripe_customer_id', customerId)
    .select('user_id');
  if (error) throw error;

  // First event for a new customer: link the Stripe customer to the account it was created for.
  const userId = userIdHint ?? best?.sub.metadata?.user_id;
  if (!rows?.length && userId) {
    const { error: linkError } = await admin
      .from('profiles')
      .update({ ...update, stripe_customer_id: customerId })
      .eq('user_id', userId);
    if (linkError) throw linkError;
  }
}

Deno.serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature');
  if (!signature) return new Response('Missing signature', { status: 400 });

  const secretKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!secretKey || !webhookSecret) {
    console.error('STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET is not set');
    return new Response('Not configured', { status: 500 }); // Stripe will retry once secrets are added
  }
  const stripe = new Stripe(secretKey, { httpClient: Stripe.createFetchHttpClient() });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      await req.text(),
      signature,
      webhookSecret,
      undefined,
      cryptoProvider,
    );
  } catch (e) {
    console.error('Bad signature', e);
    return new Response('Bad signature', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode === 'subscription' && typeof session.customer === 'string') {
          await syncCustomer(stripe, session.customer, session.client_reference_id);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused':
      case 'customer.subscription.resumed': {
        const sub = event.data.object;
        const customer = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
        await syncCustomer(stripe, customer, sub.metadata?.user_id);
        break;
      }
      default:
        break; // other events are not needed
    }
  } catch (e) {
    console.error('Sync failed', event.type, e);
    return new Response('Sync failed', { status: 500 }); // Stripe will retry
  }

  return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
});
