import type mapboxgl from "mapbox-gl";
import type { MapStyleConfig, ZoomRamp } from "./mapTheme";

const safeLayer = (map: mapboxgl.Map, id: string) => Boolean(map.getLayer(id));
const safePaint = (map: mapboxgl.Map, id: string, prop: string, val: any) => {
  try { if (safeLayer(map, id)) map.setPaintProperty(id, prop, val as any); } catch {}
};
const safeLayout = (map: mapboxgl.Map, id: string, prop: string, val: any) => {
  try { if (safeLayer(map, id)) map.setLayoutProperty(id, prop, val as any); } catch {}
};

const ramp = (r: ZoomRamp, property: string) => {
  const stops = Object.entries(r)
    .map(([k, v]) => [Number(k), v] as [number, number])
    .sort((a, b) => a[0] - b[0]);
  return ["interpolate", ["linear"], ["zoom"], ...stops.flat()] as any;
};

export function configureVisualTheme(map: mapboxgl.Map, cfg: MapStyleConfig) {
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

  // Palette
  safePaint(map, "water", "fill-color", cfg.palette.water);
  safePaint(map, "background", "background-color", cfg.palette.land);
  safePaint(map, "land", "background-color", cfg.palette.land);

  // Parks
  safePaint(map, "park", "fill-color", cfg.palette.park);
  safePaint(map, "park", "fill-opacity", cfg.parks.opacity);
  // Hide tiny parks at low zooms – if a dedicated tiny layer exists
  if (safeLayer(map, "park")) {
    try {
      // visibility by zoom
      safeLayout(map, "park", "visibility", "visible");
      // If style supports min-zoom, apply
      safeLayout(map, "park", "minzoom", cfg.parks.minZoom as any);
    } catch {}
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
      map.addLayer({
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

export { safePaint, safeLayout };


