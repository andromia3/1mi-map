CREATE TABLE if not exists public.app_admins (
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT app_admins_pkey PRIMARY KEY (user_id),
  CONSTRAINT app_admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);


