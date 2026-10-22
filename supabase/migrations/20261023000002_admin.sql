-- BE STILL: the owner's upload page.
-- Run once in Supabase: SQL Editor → New query → paste this whole file → Run. Safe to re-run.

-- Who may manage the library. Nobody can set this from the app (profiles has no update policy);
-- only you, from the SQL Editor (see the last statement).
alter table public.profiles add column if not exists is_admin boolean not null default false;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select p.is_admin from public.profiles p where p.user_id = auth.uid()), false);
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- The owner can listen to everything without subscribing.
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
      and (
        p.is_admin
        or (
          p.subscription_status in ('trialing', 'active')
          and (p.current_period_end is null or p.current_period_end > now())
        )
      )
  );
$$;

-- Admins can see drafts and add, change or remove tracks.
drop policy if exists "Admins manage tracks" on public.tracks;
create policy "Admins manage tracks"
  on public.tracks for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Admins can upload, replace and delete recordings and covers. Everyone else still has no access
-- to the private audio bucket.
drop policy if exists "Admins read library files" on storage.objects;
create policy "Admins read library files"
  on storage.objects for select
  to authenticated
  using (bucket_id in ('audio', 'covers') and (select public.is_admin()));

drop policy if exists "Admins upload library files" on storage.objects;
create policy "Admins upload library files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('audio', 'covers') and (select public.is_admin()));

drop policy if exists "Admins replace library files" on storage.objects;
create policy "Admins replace library files"
  on storage.objects for update
  to authenticated
  using (bucket_id in ('audio', 'covers') and (select public.is_admin()))
  with check (bucket_id in ('audio', 'covers') and (select public.is_admin()));

drop policy if exists "Admins delete library files" on storage.objects;
create policy "Admins delete library files"
  on storage.objects for delete
  to authenticated
  using (bucket_id in ('audio', 'covers') and (select public.is_admin()));
