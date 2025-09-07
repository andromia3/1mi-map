import type mapboxgl from "mapbox-gl";
import type { MapStyleConfig, ZoomRamp, StyleKey } from "./mapTheme";

const safeLayer = (map: mapboxgl.Map, id: string | null) => Boolean(id && map.getLayer(id));
const safePaint = (map: mapboxgl.Map, id: string | null, prop: string, val: any) => {
  try { if (safeLayer(map, id)) map.setPaintProperty(id as string, prop, val as any); } catch {}
};
const safeLayout = (map: mapboxgl.Map, id: string | null, prop: string, val: any) => {
  try { if (safeLayer(map, id)) map.setLayoutProperty(id as string, prop, val as any); } catch {}
};
const safeAddLayer = (map: mapboxgl.Map, def: any, beforeId?: string | null) => {
  try { if (!map.getLayer(def?.id)) map.addLayer(def, beforeId || undefined); } catch (e) { if (process.env.NODE_ENV !== 'production') { console.warn('safeAddLayer warn', e); } }
};

const ramp = (r: ZoomRamp, property: string) => {
  const stops = Object.entries(r)
    .map(([k, v]) => [Number(k), v] as [number, number])
    .sort((a, b) => a[0] - b[0]);
  return ["interpolate", ["linear"], ["zoom"], ...stops.flat()] as any;
};

export function configureVisualTheme(map: mapboxgl.Map, cfg: MapStyleConfig, opts?: { styleKey?: StyleKey }) {
  if (!map || !map.isStyleLoaded?.()) {
    // Defer until style is ready; caller should handle retry on style.load
  }
  // Camera
  try {
    map.jumpTo({
      center: cfg.camera.center as any,
      zoom: cfg.camera.zoom,
      pitch: cfg.camera.pitch,
      bearing: cfg.camera.bearing,
    });
  } catch {}

  // Fog
  try {
    map.setFog({
      range: cfg.fog.range,
      "horizon-blend": cfg.fog.horizonBlend,
      color: "#fff",
      "high-color": "#fff",
      "space-color": "#fff",
    } as any);
  } catch {}

  const isSatellite = opts?.styleKey === 'satellite';
  // Palette (skip recolors on satellite imagery styles)
  if (!isSatellite) {
    safePaint(map, "water", "fill-color", cfg.palette.water);
    safePaint(map, "background", "background-color", cfg.palette.land);
    safePaint(map, "land", "background-color", cfg.palette.land);
  }

  // Parks
  if (!isSatellite) {
    safePaint(map, "park", "fill-color", cfg.palette.park);
    safePaint(map, "park", "fill-opacity", cfg.parks.opacity);
    if (safeLayer(map, "park")) {
      try {
        safeLayout(map, "park", "visibility", "visible");
        safeLayout(map, "park", "minzoom", cfg.parks.minZoom as any);
      } catch {}
    }
  }

  // Labels
  safePaint(map, "place-label", "text-halo-color", cfg.palette.labelHalo);
  safePaint(map, "place-label", "text-halo-width", cfg.labels.haloWidth);
  safePaint(map, "poi-label", "text-size", ramp(cfg.labels.poiTextSize, "text-size"));

  // Transit
  safeLayout(map, "transit-line", "minzoom", cfg.transit.minZoom as any);
  safePaint(map, "transit-line", "line-opacity", ramp(cfg.transit.lineOpacity, "line-opacity"));

  // Roads hierarchy
  safePaint(map, "road-motorway", "line-width", ramp(cfg.roads.motorwayWidth, "line-width"));
  safePaint(map, "road-primary", "line-width", ramp(cfg.roads.primaryWidth, "line-width"));
  safePaint(map, "road-secondary", "line-width", ramp(cfg.roads.secondaryWidth, "line-width"));
  safePaint(map, "road-street", "line-opacity", ramp(cfg.roads.residentialOpacity, "line-opacity"));

  // 3D buildings layer below labels
  try {
    const hasSource = !!map.getSource("composite");
    const layers = (map.getStyle() as any).layers || [];
    const labelLayerId = layers.find((l: any) => l.type === "symbol" && (l.layout || {})["text-field"])?.id;
    if (hasSource && !map.getLayer("3d-buildings")) {
      safeAddLayer(map, {
        id: "3d-buildings",
        source: "composite",
        "source-layer": "building",
        filter: ["==", ["get", "extrude"], "true"],
        type: "fill-extrusion",
        minzoom: cfg.buildings3d.minZoom,
        paint: {
          "fill-extrusion-color": cfg.palette.building,
          "fill-extrusion-opacity": cfg.buildings3d.opacity,
          "fill-extrusion-height": ["coalesce", ["get", "height"], cfg.buildings3d.minHeight],
          "fill-extrusion-base": ["coalesce", ["get", "min_height"], 0],
        },
      } as any, labelLayerId);
    }
  } catch {}
}

export { safePaint, safeLayout, safeAddLayer };


