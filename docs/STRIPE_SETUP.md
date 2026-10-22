# Connecting BE STILL to Stripe (test mode)

Everything here is in **test mode**: no real money moves. Your Supabase project:
https://supabase.com/dashboard/project/tyhbiskxvcbelvkryoqx

> **Never paste a key starting with `sk_` or `whsec_` into a chat, email or GitHub.** Those go only into Supabase → Edge Functions → Secrets.

## 1. Create the product and the two prices (Stripe)
1. Stripe Dashboard → make sure the **Test mode** switch (top right) is on.
2. **Product catalog → + Add product**
   - Name: `BE STILL Full Library`
   - Price 1: **Recurring**, `6.99`, **CAD**, billing period **Monthly** → Add product.
3. Open the product → **+ Add another price**: **Recurring**, `59.99`, **CAD**, **Yearly**.
4. Copy each price's **ID** (starts with `price_`). You'll need both in step 4.

## 2. Customer Portal settings (Stripe)
**Settings → Billing → Customer portal** → turn on: *Cancel subscriptions*, *Switch plans* (add both prices), *Update payment methods*. Save.

## 3. Deploy the three payment functions (Supabase)
Same way as `get-audio-url`: **Edge Functions → Deploy a new function → Via Editor**, paste the file, set the name, deploy, then turn **off** "Verify JWT".

| Name | File |
|---|---|
| `create-checkout-session` | `supabase/functions/create-checkout-session/index.ts` |
| `create-portal-session` | `supabase/functions/create-portal-session/index.ts` |
| `stripe-webhook` | `supabase/functions/stripe-webhook/index.ts` |

## 4. Add the secrets (Supabase)
**Edge Functions → Secrets** (or **Project Settings → Edge Functions**), add:

| Name | Value |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys → **Secret key** (`sk_test_…`) |
| `STRIPE_PRICE_MONTHLY` | the monthly `price_…` ID |
| `STRIPE_PRICE_YEARLY` | the yearly `price_…` ID |
| `SITE_URL` | `http://localhost:8081` (at launch add your domain, comma-separated) |
| `STRIPE_WEBHOOK_SECRET` | from step 5 (`whsec_…`) |

## 5. Tell Stripe where to send updates (Stripe)
**Developers → Webhooks → + Add endpoint** (or *Add destination*):
- Endpoint URL: `https://tyhbiskxvcbelvkryoqx.supabase.co/functions/v1/stripe-webhook`
- Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.paused`, `customer.subscription.resumed`
- Save, then reveal the **Signing secret** (`whsec_…`) and add it as `STRIPE_WEBHOOK_SECRET` in step 4.

## 6. Test it
1. In the app, sign in → tap a locked track → **Unlock the full library** → **Start Free Trial**.
2. On Stripe's page use the test card **4242 4242 4242 4242**, any future date, any 3-digit code, any postal code.
3. You return to Account: "Confirming your subscription…" then **"Welcome to the full library."**
4. **Account → Manage subscription** → cancel → back in the app the plan updates within a few seconds.
5. Stripe → Developers → Webhooks → your endpoint should show the events with **200 OK**.

Going live later = switch Stripe to live mode, create the same product/prices there, and replace the test keys/IDs/webhook with live ones. We'll do that together at launch.
