-- Profile completeness helpers (PL/pgSQL implementation)

create or replace function public.profile_is_complete(uid uuid)
returns boolean
language plpgsql
stable
as $$
declare r record;
begin
  select username, display_name, city, timezone into r
  from public.profiles where id = uid;
  if r is null then return false; end if;
  return
    coalesce(nullif(trim(r.username), ''), '') <> '' and
    coalesce(nullif(trim(r.display_name), ''), '') <> '' and
    coalesce(nullif(trim(r.city), ''), '') <> '' and
    coalesce(nullif(trim(r.timezone), ''), '') <> '';
end $$;

create or replace view public.current_user_profile_complete as
select auth.uid() as id, public.profile_is_complete(auth.uid()) as is_complete;


