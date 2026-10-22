-- BE STILL: database setup
-- Run once in Supabase: Dashboard → SQL Editor → New query → paste this whole file → Run.
-- Safe to re-run: it only creates what is missing.

-- ─────────────────────────────────────────────────────────────
-- Tracks: the music library
-- ─────────────────────────────────────────────────────────────
create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  description text not null default '',
  category text not null check (category in ('prayer', 'meditation', 'sleep', 'scripture', 'focus')),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  audio_path text,          -- path inside the PRIVATE "audio" bucket
  cover_path text,          -- path inside the public "covers" bucket
  is_free boolean not null default false,
  sort_order integer not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists tracks_listing_idx on public.tracks (published, sort_order);

-- ─────────────────────────────────────────────────────────────
-- Profiles: one row per account, holds subscription status
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  subscription_status text not null default 'none'
    check (subscription_status in ('none', 'trialing', 'active', 'past_due', 'canceled')),
  current_period_end timestamptz,
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create a profile automatically whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Favourites
-- ─────────────────────────────────────────────────────────────
create table if not exists public.favourites (
  user_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  track_id uuid not null references public.tracks (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

-- ─────────────────────────────────────────────────────────────
-- Subscription check (used by the audio Edge Function)
-- The single source of truth; Stripe (step 4) and RevenueCat (phase 2) only write profiles.
-- ─────────────────────────────────────────────────────────────
create or replace function public.has_active_subscription(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = uid
      and p.subscription_status in ('trialing', 'active')
      and (p.current_period_end is null or p.current_period_end > now())
  );
$$;

revoke execute on function public.has_active_subscription(uuid) from public, anon, authenticated;
grant execute on function public.has_active_subscription(uuid) to service_role;

-- Lets a signed-in person permanently delete their own account (and, via cascades, their data).
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Row Level Security: nobody sees or changes anything unless a rule below allows it
-- ─────────────────────────────────────────────────────────────
alter table public.tracks enable row level security;
alter table public.profiles enable row level security;
alter table public.favourites enable row level security;

-- Anyone may browse published tracks. Nobody may change tracks from the app
-- (uploads go through the admin page, which uses the server-side service key).
drop policy if exists "Published tracks are visible to everyone" on public.tracks;
create policy "Published tracks are visible to everyone"
  on public.tracks for select
  to anon, authenticated
  using (published);

-- People can read their own profile. Only the server (Stripe webhook) may change it.
drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- People manage only their own favourites, and only for published tracks.
drop policy if exists "Read own favourites" on public.favourites;
create policy "Read own favourites"
  on public.favourites for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Add own favourites" on public.favourites;
create policy "Add own favourites"
  on public.favourites for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.tracks t where t.id = track_id and t.published)
  );

drop policy if exists "Remove own favourites" on public.favourites;
create policy "Remove own favourites"
  on public.favourites for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ─────────────────────────────────────────────────────────────
-- Storage
--   audio  : PRIVATE. No policies, so only the server can read it; listeners get
--            short-lived signed links from the get-audio-url Edge Function.
--   covers : public images (artwork is not paid content).
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('audio', 'audio', false, 104857600, array['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac']),
  ('covers', 'covers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ─────────────────────────────────────────────────────────────
-- Placeholder tracks (audio is bundled in the app until real recordings are uploaded)
-- ─────────────────────────────────────────────────────────────
insert into public.tracks (slug, title, description, category, duration_seconds, is_free, sort_order, published)
values
  ('morning-peace', 'Morning Peace', 'A gentle beginning to the day.', 'prayer', 82, true, 1, true),
  ('in-his-presence', 'In His Presence', 'Slow, open chords for worship and stillness.', 'meditation', 84, true, 2, true),
  ('still-waters', 'Still Waters', 'He leads me beside still waters. Psalm 23', 'scripture', 82, false, 3, true),
  ('rest', 'Rest', 'Soft and unhurried, for falling asleep.', 'sleep', 88, false, 4, true),
  ('secret-place', 'Secret Place', 'Quiet time alone with God.', 'focus', 84, false, 5, true)
on conflict (slug) do nothing;
