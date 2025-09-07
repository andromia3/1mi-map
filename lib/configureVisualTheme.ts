import type mapboxgl from "mapbox-gl";
import type { MapStyleConfig } from "./theme";
import { safeAddLayer, safeLayout, safePaint } from "./mapboxHelpers";

type ZoomRamp = { [zoom: string]: number };
const ramp = (r: ZoomRamp) => {
  const stops = Object.entries(r)
    .map(([k, v]) => [Number(k), v] as [number, number])
    .sort((a, b) => a[0] - b[0]);
  return ["interpolate", ["linear"], ["zoom"], ...stops.flat()] as any;
};

export function configureVisualTheme(map: mapboxgl.Map, cfg: MapStyleConfig, opts?: { isSatellite?: boolean }) {
  if (!map || !map.isStyleLoaded?.()) { return; }
  const isSatellite = Boolean(opts?.isSatellite);
  const applyCameraFog = () => {
    try {
      map.setFog({
        range: cfg.fog.range,
        "horizon-blend": cfg.fog.horizonBlend,
      } as any);
    } catch {}
  };
  const applyLabels = () => {
    // Labels and halos (lightweight, first)
    safePaint(map, "place-label", "text-halo-color", cfg.palette.labelHalo);
    safePaint(map, "place-label", "text-halo-width", cfg.labels.haloWidth);
    safePaint(map, "poi-label", "text-size", ramp(cfg.labels.poiTextSize));
    // Hide default Mapbox POI blue icons to keep map minimal
    safePaint(map, "poi-label", "icon-opacity", 0 as any);
    safeLayout(map, "poi", "visibility", "none" as any);
    // Transit visibility can go early
    safeLayout(map, "transit-line", "minzoom", cfg.transit.minZoom as any);
    safePaint(map, "transit-line", "line-opacity", ramp(cfg.transit.lineOpacity));
    // Waterway labels: halo and spacing for legibility
    safePaint(map, "waterway-label", "text-halo-color", cfg.palette.labelHalo);
    safePaint(map, "waterway-label", "text-halo-width", 1.2 as any);
    safeLayout(map, "waterway-label", "text-letter-spacing", 0.1 as any);
  };
  const applyBuildings = () => {
    try {
      const hasSource = !!map.getSource("composite");
      // place below first label layer
      const layers = (map.getStyle() as any)?.layers || [];
      const beforeId = layers.find((l: any) => l.type === 'symbol' && (l.layout || {})['text-field'])?.id;
      if (hasSource && !map.getLayer("ly-3d-buildings")) {
        safeAddLayer(map, {
          id: "ly-3d-buildings",
          source: "composite",
          "source-layer": "building",
          type: "fill-extrusion",
          minzoom: cfg.buildings3d.minZoom,
          paint: {
            "fill-extrusion-opacity": cfg.buildings3d.opacity,
            "fill-extrusion-height": ["coalesce", ["get", "height"], cfg.buildings3d.minHeight],
            "fill-extrusion-base": ["coalesce", ["get", "min_height"], 0],
            "fill-extrusion-vertical-gradient": true,
            "fill-extrusion-color": ["interpolate", ["linear"], ["coalesce", ["get", "height"], 6], 0, "#D8D8C8", 100, "#C8C8C8", 200, "#BEBEBE"],
          },
        } as any, beforeId);
      }
    } catch {}
  };
  const applyPaletteParksRoads = () => {
    if (!isSatellite) {
      // Palette and land/water
      safePaint(map, "water", "fill-color", cfg.palette.water);
      safePaint(map, "background", "background-color", cfg.palette.land);
      safePaint(map, "land", "background-color", cfg.palette.land);
      // Parks
      safePaint(map, "park", "fill-color", cfg.palette.park);
      safePaint(map, "park", "fill-opacity", cfg.parks.opacity);
      try {
        try {
          safeLayout(map, "park", "visibility", "visible");
          safeLayout(map, "park", "minzoom", cfg.parks.minZoom as any);
        } catch {}
      } catch {}
      // Roads
      safePaint(map, "road-motorway", "line-width", ramp(cfg.roads.motorwayWidth));
      safePaint(map, "road-primary", "line-width", ramp(cfg.roads.primaryWidth));
      safePaint(map, "road-secondary", "line-width", ramp(cfg.roads.secondaryWidth));
      safePaint(map, "road-street", "line-opacity", ramp(cfg.roads.residentialOpacity));
      // Casings
      const isNight = false;
      const casingColor = isNight ? "#ffffff" : "#0f172a";
      const casingOpacity = 0.28;
      const extraWidth = 1;
      const addCasingFor = (baseId: string) => {
        try {
          const casingId = `${baseId}-casing`;
          if (map.getLayer(casingId)) return;
          const base: any = map.getLayer(baseId as any);
          if (!base) return;
          const baseWidth = map.getPaintProperty(baseId as any, "line-width") as any;
          const casingWidth = baseWidth ? (["+", baseWidth as any, extraWidth] as any) : extraWidth + 1;
          const def: any = {
            id: casingId,
            type: "line",
            source: base.source,
            "source-layer": base["source-layer"],
            filter: base.filter,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": casingColor,
              "line-width": casingWidth,
              "line-opacity": casingOpacity,
            },
          };
          safeAddLayer(map, def, baseId);
        } catch {}
      };
      addCasingFor("road-motorway");
      addCasingFor("road-primary");
      addCasingFor("road-secondary");
    }
  };

  // Staged apply to reduce blocking
  applyCameraFog();
  requestAnimationFrame(() => {
    applyLabels();
    requestAnimationFrame(() => {
      applyBuildings();
      requestAnimationFrame(() => {
        applyPaletteParksRoads();
      });
    });
  });
}

export { safePaint, safeLayout, safeAddLayer };


