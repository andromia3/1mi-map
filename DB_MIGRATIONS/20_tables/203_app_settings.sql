CREATE TABLE if not exists public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  config jsonb NOT NULL,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT app_settings_pkey PRIMARY KEY (id),
  CONSTRAINT app_settings_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);


