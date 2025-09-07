begin;

-- 2.1 Helper: updated_at trigger
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- 2.2 Admins + membership basics
create table if not exists public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

do $$ begin
  create type public.membership_tier as enum ('standard','plus','founder');
exception when duplicate_object then null; end $$;

create table if not exists public.app_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier public.membership_tier not null default 'standard',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_app_memberships_updated on public.app_memberships;
create trigger trg_app_memberships_updated
before update on public.app_memberships
for each row execute function public.tg_set_updated_at();

-- 2.3 Helper: is_app_admin(uid)
create or replace function public.is_app_admin(uid uuid)
returns boolean language sql stable as $$
  select exists (select 1 from public.app_admins a where a.user_id = uid);
$$;

-- 2.4 Profiles (no usernames; email comes from auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  city text,
  timezone text,
  image_url text,
  bio text,
  linkedin_url text,
  instagram_url text,
  x_url text,
  youtube_url text,
  website_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
before update on public.profiles
for each row execute function public.tg_set_updated_at();

-- 2.5 Completeness helper for onboarding
create or replace function public.profile_is_complete(uid uuid)
returns boolean language plpgsql stable as $$
declare r record;
begin
  select display_name, city, timezone into r
  from public.profiles where id = uid;
  if r is null then return false; end if;
  return
    coalesce(nullif(trim(r.display_name), ''), '') <> '' and
    coalesce(nullif(trim(r.city), ''), '') <> '' and
    coalesce(nullif(trim(r.timezone), ''), '') <> '';
end $$;

create or replace view public.current_user_profile_complete as
select auth.uid() as id, public.profile_is_complete(auth.uid()) as is_complete;

-- 2.6 RLS: enable and lock down
alter table public.profiles enable row level security;
alter table public.app_admins enable row level security;
alter table public.app_memberships enable row level security;

-- profiles: self-only read/write
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
for select to authenticated
using (id = auth.uid());

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
for insert to authenticated
with check (id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- app_admins: only admins may read/write
drop policy if exists app_admins_read on public.app_admins;
create policy app_admins_read on public.app_admins
for select to authenticated
using (public.is_app_admin(auth.uid()));

drop policy if exists app_admins_write on public.app_admins;
create policy app_admins_write on public.app_admins
for all to authenticated
using (public.is_app_admin(auth.uid()))
with check (public.is_app_admin(auth.uid()));

-- app_memberships: read own OR admin; write admin only
drop policy if exists app_memberships_read on public.app_memberships;
create policy app_memberships_read on public.app_memberships
for select to authenticated
using (user_id = auth.uid() or public.is_app_admin(auth.uid()));

drop policy if exists app_memberships_write on public.app_memberships;
create policy app_memberships_write on public.app_memberships
for all to authenticated
using (public.is_app_admin(auth.uid()))
with check (public.is_app_admin(auth.uid()));

commit;

