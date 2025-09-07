-- Enable RLS and enforce self-only access on profiles and user_settings

-- profiles: rows keyed by id = auth.uid()
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY profiles_select_self ON public.profiles
    FOR SELECT USING (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY profiles_update_self ON public.profiles
    FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- user_settings: rows keyed by user_id = auth.uid()
ALTER TABLE IF EXISTS public.user_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY user_settings_select_self ON public.user_settings
    FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY user_settings_update_self ON public.user_settings
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


