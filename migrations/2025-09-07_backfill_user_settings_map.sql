-- Backfill map.style_key and map.last_view in public.user_settings.settings (jsonb)
-- Ensure settings.map exists
UPDATE public.user_settings
SET settings = jsonb_set(
  coalesce(settings, '{}'::jsonb),
  '{map}',
  coalesce(settings->'map', '{}'::jsonb),
  true
);

-- Backfill style_key (default to "default" if missing)
UPDATE public.user_settings
SET settings = jsonb_set(
  settings,
  '{map,style_key}',
  to_jsonb(coalesce(settings#>>'{map,style_key}', 'default')),
  true
);

-- Backfill last_view if missing
UPDATE public.user_settings
SET settings = jsonb_set(
  settings,
  '{map,last_view}',
  '{"center":[-0.1276,51.5074],"zoom":11.5,"pitch":60,"bearing":-18}'::jsonb,
  true
)
WHERE (settings#>'{map,last_view}') IS NULL;


