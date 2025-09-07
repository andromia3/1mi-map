-- Seed a 'satellite' map style if missing
-- We keep palette values for completeness, but note: satellite tiles are imagery;
-- recolors are skipped in effective theming logic.

insert into public.map_styles as ms (key, config)
select 'satellite', jsonb_build_object(
  'palette', jsonb_build_object(
    'land', '#EDEDD5',
    'water', '#18391A',
    'park', '#275D2B',
    'building', '#D8D8C8',
    'labelHalo', '#FFFFFF'
  ),
  'parks', jsonb_build_object('opacity', 0.35, 'minAreaM2', 2500, 'minZoom', 11, 'tinyParksShowZoom', 13),
  'roads', jsonb_build_object(
    'motorwayWidth', jsonb_build_object('10', 1.6, '14', 5),
    'primaryWidth', jsonb_build_object('10', 1.2, '14', 3.5),
    'secondaryWidth', jsonb_build_object('10', 0.9, '14', 2.5),
    'residentialOpacity', jsonb_build_object('10', 0.25, '14', 0.65)
  ),
  'labels', jsonb_build_object('haloWidth', 1.2, 'poiTextSize', jsonb_build_object('12', 10, '14', 11)),
  'transit', jsonb_build_object('minZoom', 10.5, 'lineOpacity', jsonb_build_object('10', 0.15, '14', 0.35), 'classes', jsonb_build_object('0','rail','1','subway')),
  'buildings3d', jsonb_build_object('minZoom', 13, 'opacity', 0.95, 'minHeight', 6),
  'camera', jsonb_build_object('center', jsonb_build_array(-0.1276, 51.5072), 'zoom', 12, 'pitch', 45, 'bearing', -17.6),
  'fog', jsonb_build_object('range', jsonb_build_array(0.2, 10), 'horizonBlend', 0.1)
) 
where not exists (select 1 from public.map_styles where key = 'satellite');


