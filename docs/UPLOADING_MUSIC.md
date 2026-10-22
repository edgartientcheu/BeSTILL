# Adding your music

## One-time setup
1. **Supabase → SQL Editor → + New query**, paste [`supabase/migrations/20261023000002_admin.sql`](../supabase/migrations/20261023000002_admin.sql), click **Run**.
2. Make your account the owner (use the email you sign in to BE STILL with):
   ```sql
   update public.profiles set is_admin = true
   where user_id = (select id from auth.users where email = 'you@example.com');
   ```
   Only accounts marked this way can open the upload page. Nobody can mark themselves from the app.

## Uploading a track
1. Open the app, sign in, go to **Account → Upload music** (or open `/admin`).
2. Fill in the title, an optional one-line description, the category, and **Paid** or **Free preview**.
3. Choose the recording (**MP3 or M4A**, up to 50 MB; MP3 at 192 kbps is plenty for piano) and, optionally, a square cover image (JPG/PNG, at least 1000×1000 looks best).
4. Leave **Publish now** on to make it live immediately, or turn it off to keep a hidden draft.
5. Click **Upload track**. It appears in the app straight away.

The recording goes into the **private** `audio` storage; listeners only ever get short-lived links.

## Managing tracks
Each track in the list has **Publish/Hide**, **Make free/Make paid** and **Delete**. Rows marked *placeholder* are the five built-in sample tracks; delete them once your real music is in.

To change the order tracks appear in, edit the `sort_order` numbers in **Supabase → Table Editor → tracks** (smaller numbers come first).
