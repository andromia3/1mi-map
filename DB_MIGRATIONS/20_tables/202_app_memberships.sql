CREATE TABLE if not exists public.app_memberships (
  user_id uuid NOT NULL,
  tier membership_tier NOT NULL DEFAULT 'Yearly Member'::membership_tier,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT app_memberships_pkey PRIMARY KEY (user_id),
  CONSTRAINT app_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);


