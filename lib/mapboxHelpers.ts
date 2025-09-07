import type mapboxgl from 'mapbox-gl';

export const safeLayer = (map: mapboxgl.Map, id: string | null) => Boolean(id && map.getLayer(id));

export const safePaint = (map: mapboxgl.Map, id: string | null, prop: string, val: any) => {
  try { if (safeLayer(map, id)) map.setPaintProperty(id as string, prop, val as any); } catch {}
};

export const safeLayout = (map: mapboxgl.Map, id: string | null, prop: string, val: any) => {
  try { if (safeLayer(map, id)) map.setLayoutProperty(id as string, prop, val as any); } catch {}
};

export const safeAddLayer = (map: mapboxgl.Map, def: any, beforeId?: string | null) => {
  try { if (!map.getLayer(def?.id)) map.addLayer(def, beforeId || undefined); } catch {}
};

export const findFirstLayerId = (
  map: mapboxgl.Map,
  predicate: (layer: any) => boolean,
): string | null => {
  try {
    const layers = (map.getStyle() as any)?.layers || [];
    const match = layers.find((l: any) => predicate(l));
    return match?.id || null;
  } catch {
    return null;
  }
};


