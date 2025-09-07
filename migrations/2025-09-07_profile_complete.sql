-- Profiles completeness helper and view

-- 1) Function: profile_is_complete(uid uuid) -> boolean
create or replace function public.profile_is_complete(uid uuid)
returns boolean
language sql
stable
as $$
  select coalesce(
    (
      select
        (nullif(btrim(username), '') is not null)
        and (nullif(btrim(display_name), '') is not null)
        and (nullif(btrim(city), '') is not null)
        and (nullif(btrim(timezone), '') is not null)
      from public.profiles p
      where p.id = uid
    ),
    false
  );
$$;

comment on function public.profile_is_complete(uuid) is 'Returns true when the profile has non-empty username, display_name, city, and timezone.';

-- 2) View for current authenticated user
create or replace view public.current_user_profile_complete as
select
  auth.uid() as id,
  public.profile_is_complete(auth.uid()) as is_complete;

comment on view public.current_user_profile_complete is 'One-row view showing whether the current user profile is complete.';

-- 3) Optional: functional unique index to help enforce lowercase uniqueness on usernames
do $$
begin
  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relname = 'profiles_username_lower_unique'
      and n.nspname = 'public'
  ) then
    create unique index profiles_username_lower_unique on public.profiles (lower(username));
  end if;
end$$;


