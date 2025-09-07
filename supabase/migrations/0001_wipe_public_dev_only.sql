begin;

-- Drop views first
do $$
declare r record;
begin
  for r in
    select schemaname, viewname from pg_views
    where schemaname = 'public'
  loop
    execute format('drop view if exists %I.%I cascade;', r.schemaname, r.viewname);
  end loop;
end $$;

-- Drop materialized views
do $$
declare r record;
begin
  for r in
    select schemaname, matviewname from pg_matviews
    where schemaname = 'public'
  loop
    execute format('drop materialized view if exists %I.%I cascade;', r.schemaname, r.matviewname);
  end loop;
end $$;

-- Drop functions
do $$
declare r record;
begin
  for r in
    select n.nspname as schemaname, p.proname, oidvectortypes(p.proargtypes) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  loop
    execute format('drop function if exists %I.%I(%s) cascade;', r.schemaname, r.proname, r.args);
  end loop;
end $$;

-- Drop types (enums)
do $$
declare r record;
begin
  for r in
    select n.nspname as schemaname, t.typname
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typtype = 'e'
  loop
    execute format('drop type if exists %I.%I cascade;', r.schemaname, r.typname);
  end loop;
end $$;

-- Drop tables (this will also drop policies & triggers)
do $$
declare r record;
begin
  for r in
    select schemaname, tablename from pg_tables
    where schemaname = 'public'
  loop
    execute format('drop table if exists %I.%I cascade;', r.schemaname, r.tablename);
  end loop;
end $$;

commit;

