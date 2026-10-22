# Connecting BE STILL to Supabase

About 15 minutes, all in your web browser, all free. Your project: **https://supabase.com/dashboard/project/tyhbiskxvcbelvkryoqx**

## 1. Create the database tables and security rules

1. In the left menu click **SQL Editor**, then **+ New query**.
2. Open [`supabase/migrations/20261022000001_init.sql`](../supabase/migrations/20261022000001_init.sql) on GitHub, click the **Copy raw file** button, and paste it into the editor.
3. Click **Run**. You should see "Success. No rows returned".
4. Check: click **Table Editor**. You should see `tracks` (with 5 rows), `profiles` and `favourites`. Click **Storage**: you should see an `audio` bucket (private) and a `covers` bucket (public).

It is safe to run the file again if you're unsure whether it worked.

## 2. Add the "music link" function

This small server program checks whether someone may hear a track and gives them a link that expires.

1. In the left menu click **Edge Functions**, then **Deploy a new function → Via Editor**.
2. Name it exactly: `get-audio-url`
3. Delete the sample code, then copy everything from [`supabase/functions/get-audio-url/index.ts`](../supabase/functions/get-audio-url/index.ts) and paste it in.
4. Click **Deploy function**.
5. Open the function's **Settings** (or **Details**) and turn **OFF** "Enforce JWT verification" / "Verify JWT", then save. *(The code checks sign-in itself. This is needed because your project uses the new publishable keys.)*

## 3. Sign-in settings

1. **Authentication → URL Configuration**
   - **Site URL:** `http://localhost:8081` (we'll change this to your real domain at launch)
   - **Redirect URLs → Add URL:** `http://localhost:8081/**`
2. **Authentication → Sign In / Providers → Email**: keep **Confirm email** on, and set **Minimum password length** to `8`. Save.

> The built-in email sender only sends a few emails per hour, which is fine for testing. Before launch we'll connect a proper email service (step 6).

## 4. "Continue with Google" (optional now, needed before launch)

1. Go to https://console.cloud.google.com, create a project called **BE STILL**.
2. **APIs & Services → OAuth consent screen**: choose **External**, app name **BE STILL**, your support email, then save.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**
   - **Authorised redirect URIs → Add URI:** `https://tyhbiskxvcbelvkryoqx.supabase.co/auth/v1/callback`
   - Click **Create** and copy the **Client ID** and **Client secret**.
4. Back in Supabase: **Authentication → Sign In / Providers → Google** → turn it on, paste the Client ID and Client secret, **Save**.

Until this is done, the Google button politely asks people to use email.

## 5. Try it

1. On your computer: `git pull`, then make sure your `.env` file has your project values (see `.env.example`), then `npm run web`.
2. **Account → Sign in or create an account → New here? Create an account.**
3. Confirm the email Supabase sends you, then sign in.
4. Heart a track, sign out, sign in on another browser: the heart is still there.

### Give yourself the full library (for testing, until Stripe is connected in step 4)

**Table Editor → profiles →** find your row → set `subscription_status` to `active` → Save. Reload the app: the locks disappear. Set it back to `none` to see what free listeners see.
