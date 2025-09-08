begin;

-- Create user_settings table with map jsonb configuration
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  map jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Ensure updated_at trigger exists
drop trigger if exists trg_user_settings_updated on public.user_settings;
create trigger trg_user_settings_updated
before update on public.user_settings
for each row execute function public.tg_set_updated_at();

-- Enable RLS and enforce self-only access
alter table public.user_settings enable row level security;

do $$ begin
  create policy user_settings_select_self on public.user_settings
    for select to authenticated
    using (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy user_settings_insert_self on public.user_settings
    for insert to authenticated
    with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy user_settings_update_self on public.user_settings
    for update to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

commit;


