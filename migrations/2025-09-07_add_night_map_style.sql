-- Seed a 'night' visual theme for Mapbox Standard in public.map_styles
-- Assumes table structure: public.map_styles(key text primary key, config jsonb)

insert into public.map_styles as ms (key, config)
values (
  'night',
  jsonb_build_object(
    'palette', jsonb_build_object(
      'land', '#0E0F0E',
      'water', '#0D2710',
      'park', '#1E3B22',
      'building', '#3A3A3A',
      'labelHalo', '#000000'
    ),
    'parks', jsonb_build_object(
      'opacity', 0.35,
      'minAreaM2', 2500,
      'minZoom', 11,
      'tinyParksShowZoom', 13
    ),
    'roads', jsonb_build_object(
      'motorwayWidth', jsonb_build_object('10', 1.8, '14', 5.4),
      'primaryWidth', jsonb_build_object('10', 1.4, '14', 3.9),
      'secondaryWidth', jsonb_build_object('10', 1.1, '14', 2.9),
      'residentialOpacity', jsonb_build_object('10', 0.35, '14', 0.75)
    ),
    'labels', jsonb_build_object(
      'haloWidth', 1.2,
      'poiTextSize', jsonb_build_object('12', 10, '14', 11)
    ),
    'transit', jsonb_build_object(
      'minZoom', 10.5,
      'lineOpacity', jsonb_build_object('10', 0.2, '14', 0.4),
      'classes', jsonb_build_object('0','rail','1','subway')
    ),
    'buildings3d', jsonb_build_object(
      'minZoom', 13,
      'opacity', 0.95,
      'minHeight', 6
    ),
    'camera', jsonb_build_object(
      'center', jsonb_build_array(-0.1276, 51.5072),
      'zoom', 12,
      'pitch', 45,
      'bearing', -17.6
    ),
    'fog', jsonb_build_object(
      'range', jsonb_build_array(0.2, 10),
      'horizonBlend', 0.1
    )
  )
)
on conflict (key) do update set config = excluded.config;
