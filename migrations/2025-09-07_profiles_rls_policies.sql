-- Ensure RLS policies for profiles: self-only SELECT/UPDATE/INSERT

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY profiles_select_self ON public.profiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY profiles_update_self ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY profiles_insert_self ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


