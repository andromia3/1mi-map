CREATE TABLE if not exists public.amenities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT amenities_pkey PRIMARY KEY (id)
);


