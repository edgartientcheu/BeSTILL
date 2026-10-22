# BE STILL

*Piano music for prayer, meditation & quiet time.* Original piano instrumentals by Pastor Edgar.

BE STILL is built with Expo (React Native), so one codebase runs in the web browser today and on iPhone and Android later.

## Build progress

| Step | What | Status |
|---|---|---|
| 1 | Project setup, design, navigation, home and library screens | ✅ Done |
| 2 | Audio player (background play, lock-screen controls, sleep timer) | ✅ Done |
| 3 | Supabase: database, private audio storage, sign-in | ✅ Done (see [Supabase setup](docs/SUPABASE_SETUP.md)) |
| 4 | Paywall and Stripe subscriptions | ✅ Done (see [Stripe setup](docs/STRIPE_SETUP.md)) |
| 5 | Admin upload page | ⏳ Next |
| 6 | Polish, legal pages, launch checklist, deploy | |

## Run it on your computer

You only need to do this once:

1. Install **Node.js** (the "LTS" version) from https://nodejs.org.
2. Download the code: open the **Terminal** app (Mac) or **PowerShell** (Windows) and run
   ```
   git clone https://github.com/edgartientcheu/BeSTILL.git
   cd BeSTILL
   npm install
   ```

Then, each time you want to see the app:

```
npm run web
```

A browser tab opens at `http://localhost:8081`. **To try it on your phone**, connect the phone to the same Wi-Fi and open the "Network" address shown in the terminal (it looks like `http://192.168.x.x:8081`). Press `Ctrl + C` in the terminal to stop.

## About the placeholder music

The five tracks in `assets/audio/` are short synthesized piano sketches (about 80 seconds each) made so the player can be tested. They are **not** Pastor Edgar's recordings and will be removed once real music is uploaded (step 5).

## How playback works

- **One shared player** (`src/lib/player.tsx`): music keeps playing when you close the player, change tabs, lock your phone or switch to another app. A mini player above the tabs shows what's playing.
- **Lock-screen controls**: on the web this uses the browser's Media Session feature, so the lock screen and headphone buttons show the title, "Pastor Edgar", play/pause and ±10 seconds.
- **Sleep timer**: 15/30/45/60 minutes. The music fades out over the last 20 seconds, then pauses. *iPhone browsers don't allow websites to change volume, so there the music simply stops at the end. The iPhone app (Phase 2) will fade normally.*
- **Favourites** are saved to your account when signed in (and on the device when signed out; they move into the account at sign-in).

## Secrets

Keys and passwords live in a file called `.env`, which is never uploaded to GitHub. Copy `.env.example` to `.env` and fill it in when a step asks you to.

Without a `.env`, the app still runs using the 5 built-in placeholder tracks (no sign-in).

## Backend (Supabase)

Follow **[docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)** once. In short:

- `supabase/migrations/…_init.sql`: tables (`tracks`, `profiles`, `favourites`), Row Level Security on every table, the private `audio` bucket and public `covers` bucket, and the 5 placeholder tracks.
- `supabase/functions/get-audio-url`: gives a short-lived signed link to a recording, only for free tracks or active subscribers. Paid audio never has a permanent public link.
- `supabase/functions/create-checkout-session`, `create-portal-session`, `stripe-webhook`: Stripe Checkout (7-day trial for first-time subscribers), the Customer Portal, and the webhook that keeps `profiles.subscription_status` in sync. Setup: **[docs/STRIPE_SETUP.md](docs/STRIPE_SETUP.md)**.
- `hasActiveSubscription()` in `src/lib/subscription.ts` is the single subscription check in the app; the database has a matching `has_active_subscription()` used by the server.

## Project layout (for the curious)

```
src/app/            Screens. Each file is a page (Expo Router).
  (tabs)/           Home, Library, Favourites, Account
  player/[slug].tsx The player
  paywall.tsx       Subscription screen
  auth.tsx          Sign-in screen
src/components/     Reusable pieces (buttons, cover art, track rows)
src/constants/      Colours, spacing, fonts
src/data/tracks.ts  Track type and built-in placeholder tracks
supabase/           Database setup (SQL) and the get-audio-url server function
docs/               Setup guides
src/lib/            App logic, including hasActiveSubscription()
```
