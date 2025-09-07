"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { DEFAULT_THEME, NIGHT_THEME, type MapStyleConfig, type StyleKey, STYLE_URLS } from "@/lib/theme";
import { configureVisualTheme } from "@/lib/configureVisualTheme";
import type { Database } from "@/lib/supabase/types";
import MapVignetteOverlay from "./MapVignetteOverlay";

// Add-new-place functionality removed for now
type Place = Database["public"]["Tables"]["places"]["Row"];
type NearbyPlace = Database["public"]["Functions"]["nearby_places"]["Returns"][0];

interface MapViewProps {
  user: { id: string; email?: string; user_metadata?: { display_name?: string } };
}

export default function MapView({ user }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const geolocateRef = useRef<any>(null);
  const mapHandlersRef = useRef<Array<{ type: string; layer?: string; handler: any }>>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [error, setError] = useState("");
  const [userCenter, setUserCenter] = useState<[number, number] | null>(null);
  const [themeInfo, setThemeInfo] = useState<{ water: string[]; parks: string[]; roads: string[]; labels: string[]; transit: string[]; buildings: string[]; skipped?: string[] }>({ water: [], parks: [], roads: [], labels: [], transit: [], buildings: [] });
  const styles = [
    { id: "default", label: "Light", url: STYLE_URLS.default },
    { id: "night", label: "Dark", url: STYLE_URLS.night },
    { id: "satellite", label: "Satellite", url: STYLE_URLS.satellite },
  ];
  const styleUrlFor = (key: StyleKey) => STYLE_URLS[key];
  const initialStyleKey = (typeof window !== "undefined" ? ((new URLSearchParams(window.location.search).get("style") as StyleKey) || (localStorage.getItem("map:style_key") as StyleKey | null)) : null) || "default";
  const [styleKey, setStyleKey] = useState<StyleKey>(initialStyleKey);
  const [styleUrl, setStyleUrl] = useState<string>(styleUrlFor(initialStyleKey));
  const saveTimer = useRef<number | null>(null);
  const applyStyleKey = (nextKey: StyleKey) => {
    if (nextKey === styleKey && map.current) return;
    setStyleKey(nextKey);
    const nextUrl = styleUrlFor(nextKey);
    setStyleUrl(nextUrl);
    try { localStorage.setItem("map:style_key", nextKey); } catch {}
    // Force immediate style swap for reliability
    try { map.current?.setStyle(nextUrl); } catch {}
  };

  // Feature flags
  const SHOW_PLACES = false; // hide all place markers/clusters
  const lastSupabaseWriteAt = useRef<number>(0);

  // Forms, validation, and modal for adding new places have been removed

  // Get user location or last_view first
  useEffect(() => {
    const fallback: [number, number] = [-0.1276, 51.5072];
    if (typeof window === "undefined" || userCenter !== null) return;
    // Prefer cached last_view for instant UX
    try {
      const last = localStorage.getItem("map:last_view");
      if (last) {
        const parsed = JSON.parse(last) as { center: [number, number] };
        if (parsed?.center?.length === 2) {
          setUserCenter(parsed.center);
          return;
        }
      }
    } catch {}
    if (!navigator.geolocation) {
      setUserCenter(fallback);
      return;
    }
    const timeoutId = window.setTimeout(() => setUserCenter(fallback), 6000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        window.clearTimeout(timeoutId);
        setUserCenter([pos.coords.longitude, pos.coords.latitude]);
      },
      () => {
        window.clearTimeout(timeoutId);
        setUserCenter(fallback);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 600000 }
    );
  }, [userCenter]);

  // Initialize map when we know the center
  useEffect(() => {
    if (!mapContainer.current || map.current || userCenter === null) return;

    // Ensure Mapbox token exists
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "pk.eyJ1IjoiYW5kcm9taWEiLCJhIjoiY21mOXA0eWphMDlpODJscW9weWlvNXB0biJ9.lt-cpkt9IgVZwigPpimEBw";
    console.log("[map] token present:", Boolean(token));
    if (!token) {
      setError("Missing NEXT_PUBLIC_MAPBOX_TOKEN. Please set it in Netlify envs.");
      setIsLoading(false);
      return;
    }
    mapboxgl.accessToken = token;

    try {
      const { clientWidth, clientHeight } = mapContainer.current;
      console.log("[map] container size before init", { clientWidth, clientHeight });
      let initZoom = 12;
      let initPitch = 0;
      let initBearing = 0;
      try {
        const last = localStorage.getItem("map:last_view");
        if (last) {
          const parsed = JSON.parse(last) as { zoom?: number; pitch?: number; bearing?: number };
          if (typeof parsed.zoom === "number") initZoom = parsed.zoom;
          if (typeof parsed.pitch === "number") initPitch = parsed.pitch;
          if (typeof parsed.bearing === "number") initBearing = parsed.bearing;
        }
      } catch {}
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
        style: styleUrl,
        center: userCenter,
        zoom: initZoom,
        pitch: initPitch,
        bearing: initBearing,
        antialias: true,
        preserveDrawingBuffer: true as any,
        dragRotate: true,
        pitchWithRotate: true,
        attributionControl: false,
        cooperativeGestures: false,
      });
      map.current.addControl(new mapboxgl.NavigationControl({ showCompass: true, visualizePitch: true } as any), "top-left");
      map.current.addControl(new mapboxgl.ScaleControl({ unit: "metric" }), "bottom-left");
      map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

      // Observe container size and resize map to avoid blurriness/clipping
      try {
        const ro = new ResizeObserver(() => {
          try { map.current?.resize(); } catch {}
        });
        ro.observe(mapContainer.current!);
        (map.current as any)._resizeObserver = ro;
      } catch {}

      // Interaction: no artificial bounds/limits to keep free 3D pan/zoom/tilt

      // Show a pin for the user's location and keep it updated
      try {
        userMarker.current?.remove();
        userMarker.current = new mapboxgl.Marker({ color: "#2563eb" })
          .setLngLat(userCenter as [number, number])
          .addTo(map.current);
      } catch {}

      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      });
      map.current.addControl(geolocate, "top-left");
      geolocateRef.current = geolocate;
      // Enable rich interactions (rotate/pitch/scroll/keyboard/pan)
      try {
        map.current.dragRotate.enable();
        map.current.touchZoomRotate.enable();
        (map.current.touchZoomRotate as any)?.enableRotation?.();
        map.current.scrollZoom.enable();
        map.current.keyboard.enable();
        map.current.dragPan.enable();
      } catch {}
      const onUserLocate = (evt: any) => {
        try {
          const coords: [number, number] = [evt?.coords?.longitude, evt?.coords?.latitude];
          if (coords[0] != null && coords[1] != null) userMarker.current?.setLngLat(coords);
        } catch {}
      };
      geolocate.on("geolocate", onUserLocate as any);
      mapHandlersRef.current.push({ type: "geolocate", handler: onUserLocate });
    } catch (err) {
      console.error("[map] Failed to create Mapbox instance:", err);
      setError("Failed to create map. See console for details.");
      setIsLoading(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setError("Map load timed out. Please refresh or check network/token.");
      setIsLoading(false);
    }, 12000);
    const quickId = window.setTimeout(() => {
      console.warn("[map] quick-timeout:4s — releasing spinner before load/error");
      setIsLoading(false);
    }, 4000);

    map.current.on("load", async () => {
      console.log("[map] event:load fired, styleLoaded=", map.current?.isStyleLoaded?.());
      setIsLoading(false);
      const mc = map.current!;
      mc.resize();
      try { mc.easeTo({ duration: 0 }); } catch {}
      // Apply code-only theme and terrain
      const themeCfg = styleKey === 'night' ? NIGHT_THEME : DEFAULT_THEME;
      try { configureVisualTheme(mc, themeCfg, { isSatellite: styleKey === "satellite" }); } catch (e) { console.warn("[map] theme apply failed", e); }
      try {
        if (!mc.getSource("mapbox-dem")) {
          mc.addSource("mapbox-dem", { type: "raster-dem", url: "mapbox://mapbox.mapbox-terrain-dem-v1", tileSize: 512, maxzoom: 14 } as any);
        }
        mc.setTerrain({ source: "mapbox-dem", exaggeration: 1.0 } as any);
        if (!mc.getLayer("sky")) {
          mc.addLayer({ id: "sky", type: "sky", paint: { "sky-type": "atmosphere", "sky-atmosphere-sun-intensity": 10 } } as any);
        }
      } catch {}
      window.clearTimeout(timeoutId);
      window.clearTimeout(quickId);
    });
    // WebGL context loss handling
    try {
      const canvas: HTMLCanvasElement | null = (map.current as any)?.getCanvas?.() || null;
      if (canvas) {
        const onLost = (e: any) => {
          try { e?.preventDefault?.(); } catch {}
          console.warn("[map] WebGL context lost — waiting for restore");
          setIsLoading(true);
        };
        const onRestored = () => {
          console.warn("[map] WebGL context restored — triggering repaint");
          try { (map.current as any)?.triggerRepaint?.(); } catch {}
          setIsLoading(false);
        };
        canvas.addEventListener('webglcontextlost', onLost, false);
        canvas.addEventListener('webglcontextrestored', onRestored, false);
        (map.current as any)._webglHandlers = { onLost, onRestored };
      }
    } catch {}
    const onError = (e: any) => {
      if (process.env.NODE_ENV !== 'production') {
        console.groupCollapsed('[map] error');
        console.error(e);
        console.groupEnd();
      }
      setError("Map error occurred. See console for details.");
      setIsLoading(false);
      window.clearTimeout(timeoutId);
      window.clearTimeout(quickId);
    };
    map.current.on("error", onError);
    mapHandlersRef.current.push({ type: "error", handler: onError });


    return () => {
      if (map.current) {
        try { (map.current as any)._resizeObserver?.disconnect?.(); } catch {}
        try {
          const cnv: HTMLCanvasElement | null = (map.current as any)?.getCanvas?.() || null;
          const handlers = (map.current as any)._webglHandlers;
          if (cnv && handlers) {
            cnv.removeEventListener('webglcontextlost', handlers.onLost);
            cnv.removeEventListener('webglcontextrestored', handlers.onRestored);
          }
        } catch {}
        // Remove map event listeners
        try {
          for (const h of mapHandlersRef.current) {
            if (h.layer) (map.current as any).off?.(h.type, h.layer, h.handler);
            else (map.current as any).off?.(h.type, h.handler);
          }
          mapHandlersRef.current = [];
        } catch {}
        // Remove geolocate control listeners & control
        try {
          if (geolocateRef.current) {
            const onUserLocate = mapHandlersRef.current.find(h => h.type === 'geolocate')?.handler;
            if (onUserLocate) geolocateRef.current.off?.('geolocate', onUserLocate);
            map.current.removeControl(geolocateRef.current);
            geolocateRef.current = null;
          }
        } catch {}
        map.current.remove();
        map.current = null;
      }
      window.clearTimeout(timeoutId);
      window.clearTimeout(quickId);
    };
  }, [userCenter]);

  // When style changes, apply it and reconfigure layers/terrain/3D
  useEffect(() => {
    if (!map.current) return;
    const m = map.current;
    const onStyle = () => {
      try {
        // Terrain and sky for depth
        if (!m.getSource("mapbox-dem")) {
          m.addSource("mapbox-dem", {
            type: "raster-dem",
            url: "mapbox://mapbox.terrain-rgb",
            tileSize: 512,
            maxzoom: 14,
          } as any);
        }
        m.setTerrain({ source: "mapbox-dem", exaggeration: 1.1 } as any);
        if (!m.getLayer("sky")) {
          m.addLayer({
            id: "sky",
            type: "sky",
            paint: {
              "sky-type": "atmosphere",
              "sky-atmosphere-sun": [0.0, 0.0],
              "sky-atmosphere-sun-intensity": 5,
            },
          } as any);
        }
        // 3D buildings (fill-extrusion)
        const layers = (m.getStyle() as any).layers || [];
        const labelLayerId = layers.find((l: any) => l.type === "symbol" && (l.layout || {})["text-field"])?.id;
        if (!m.getLayer("3d-buildings")) {
          m.addLayer(
            {
              id: "3d-buildings",
              source: "composite",
              "source-layer": "building",
              filter: ["==", ["get", "extrude"], "true"],
              type: "fill-extrusion",
              minzoom: 15,
              paint: {
                "fill-extrusion-color": "#d1d5db",
                "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 15, 0, 16, ["get", "height"]],
                "fill-extrusion-base": ["get", "min_height"],
                "fill-extrusion-opacity": 0.6,
              },
            } as any,
            labelLayerId
          );
        }
        // Subtle accent for very tall buildings (>=120m)
        try {
          if (m.getLayer("3d-buildings") && !m.getLayer("3d-buildings-tall")) {
            m.addLayer({
              id: "3d-buildings-tall",
              source: "composite",
              "source-layer": "building",
              type: "fill-extrusion",
              minzoom: 15,
              filter: [">=", ["coalesce", ["get", "height"], 0], 120],
              paint: {
                "fill-extrusion-color": "#B0B0B0",
                "fill-extrusion-opacity": 1.0,
                "fill-extrusion-height": ["coalesce", ["get", "height"], 120],
                "fill-extrusion-base": ["coalesce", ["get", "min_height"], 0],
              },
            } as any, labelLayerId);
          }
        } catch {}
        // Borough boundaries (admin level 8) — subtle context, skip silently if missing
        try {
          const adminCandidate = layers.find((l: any) => l?.source === "composite" && typeof l?.["source-layer"] === "string" && l?.["source-layer"].includes("admin"));
          const adminSourceLayer = adminCandidate?.["source-layer"] || "admin";
          if (!m.getLayer("borough-boundaries")) {
            m.addLayer({
              id: "borough-boundaries",
              type: "line",
              source: "composite",
              "source-layer": adminSourceLayer,
              minzoom: 9.5,
              filter: ["==", ["get", "admin_level"], 8],
              paint: {
                "line-color": "#000000",
                "line-opacity": 0.15,
                "line-width": 0.8,
                "line-dasharray": [2, 2],
              },
            } as any, labelLayerId);
          }
        } catch {}
        // Pedestrian paths: dashed subtle lines for movement cues
        try {
          const roadCandidate = layers.find((l: any) => l?.source === "composite" && typeof l?.["source-layer"] === "string" && l?.["source-layer"].includes("road"));
          const roadSourceLayer = roadCandidate?.["source-layer"] || "road";
          const filterPed = ["in", ["get", "class"], ["literal", ["path", "pedestrian"]]] as any;
          if (!m.getLayer("footpaths")) {
            m.addLayer({
              id: "footpaths",
              type: "line",
              source: "composite",
              "source-layer": roadSourceLayer,
              minzoom: 12,
              filter: filterPed,
              paint: {
                "line-color": "#000000",
                "line-opacity": 0.35,
                "line-dasharray": [2, 2],
                "line-width": [
                  "interpolate", ["linear"], ["zoom"],
                  12, 0.6,
                  16, 1.2
                ],
              },
            } as any, labelLayerId);
          }
          // Optional arrows along line if sprite contains a suitable icon
          try {
            const arrowIcon = (m.hasImage as any)?.call(m, "oneway-small") ? "oneway-small" : null;
            if (arrowIcon && !m.getLayer("footpaths-arrows")) {
              m.addLayer({
                id: "footpaths-arrows",
                type: "symbol",
                source: "composite",
                "source-layer": roadSourceLayer,
                minzoom: 13,
                filter: filterPed,
                layout: {
                  "symbol-placement": "line",
                  "symbol-spacing": 80,
                  "icon-image": arrowIcon,
                  "icon-size": ["interpolate", ["linear"], ["zoom"], 12, 0.6, 16, 0.9],
                  "icon-rotation-alignment": "map",
                  "icon-pitch-alignment": "viewport",
                },
                paint: {
                  "icon-opacity": 0.2,
                },
              } as any, labelLayerId);
            }
          } catch {}
        } catch {}
        // Re-apply theme after style reload
        try {
          const cfg = styleKey === 'night' ? NIGHT_THEME : DEFAULT_THEME;
          configureVisualTheme(m, cfg, { isSatellite: styleKey === "satellite" });
        } catch {}
        // Collect themed layer matches for HUD (first 8 per category)
        try {
          const coll = (ids: string[]) => ids.filter((id) => !!m.getLayer(id)).slice(0, 8);
          const isSat = styleKey === "satellite";
          setThemeInfo({
            water: coll(["water"]),
            parks: isSat ? [] : coll(["park"]),
            roads: isSat ? [] : coll(["road-motorway", "road-primary", "road-secondary", "road-street"]),
            labels: coll(["place-label", "poi-label"]),
            transit: coll(["transit-line"]),
            buildings: coll(["3d-buildings"]),
            skipped: isSat ? ["water", "parks", "roads"] : [],
          });
        } catch {}
      } catch {}
    };
    m.on("style.load", onStyle);
    m.setStyle(styleUrl);
    return () => { m.off("style.load", onStyle); };
  }, [styleUrl]);

  // Load places and set up realtime subscription
  useEffect(() => {
    const loadPlaces = async () => {
      try {
        const supabase = supabaseBrowser();
        const { data: places, error } = await supabase
          .from("places")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (error) {
          console.error("[map] Failed to load places:", error);
        } else {
          setPlaces(places || []);
        }
      } catch (err) {
        console.error("[map] Failed to load places:", err);
      }
    };

    loadPlaces();

    // Set up realtime subscription for places
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel("public:places")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "places" },
        (payload) => {
          console.log("[map] Places updated:", payload);
          // Reload places when any change occurs
          loadPlaces();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Helper function to load nearby places
  const loadNearbyPlaces = async (lat: number, lng: number, radiusM: number = 2000) => {
    setIsLoadingNearby(true);
    setError("");
    
    try {
      const supabase = supabaseBrowser();
      const { data: nearby, error } = await supabase.rpc('nearby_places', {
        p_lat: lat,
        p_lng: lng,
        p_radius_m: radiusM,
      } as any);
      
      if (error) {
        console.error("Failed to load nearby places:", error);
        setError("Failed to load nearby places");
      } else {
        setNearbyPlaces(nearby || []);
      }
    } catch (err) {
      console.error("Failed to load nearby places:", err);
      setError("Failed to load nearby places");
    } finally {
      setIsLoadingNearby(false);
    }
  };

  // GeoJSON for places
  const placesGeoJson = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: (places || []).map((p) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] as [number, number] },
      properties: {
        title: p.title,
        description: p.description || "",
        addedBy: user.user_metadata?.display_name || user.email || "",
      },
    })),
  }), [places, user])

  // Clustered places layer (disabled when SHOW_PLACES=false)
  useEffect(() => {
    if (!map.current || !SHOW_PLACES) return;
    const m = map.current;
    const sourceId = "places-src";
    const clusterLayer = "places-clusters";
    const clusterCount = "places-cluster-count";
    const unclustered = "places-unclustered";

    const ensureLayers = () => {
      if (!m.getSource(sourceId)) {
        m.addSource(sourceId, {
          type: "geojson",
          data: placesGeoJson as any,
          cluster: true,
          clusterRadius: 60,
          clusterMaxZoom: 14,
        } as any);

        m.addLayer({
          id: clusterLayer,
          type: "circle",
          source: sourceId,
          filter: ["has", "point_count"],
          paint: {
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#93c5fd",
              10, "#60a5fa",
              25, "#3b82f6",
              50, "#2563eb",
            ],
            "circle-radius": ["step", ["get", "point_count"], 16, 25, 22, 50, 28],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        } as any);

        m.addLayer({
          id: clusterCount,
          type: "symbol",
          source: sourceId,
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["get", "point_count_abbreviated"],
            "text-size": ["interpolate", ["linear"], ["zoom"], 10, 11, 14, 13, 18, 15],
            "text-rotation-alignment": "map",
            "text-pitch-alignment": "viewport",
          },
          paint: { "text-color": "#0f172a" },
        } as any);

        m.addLayer({
          id: unclustered,
          type: "circle",
          source: sourceId,
          filter: ["!has", "point_count"],
          paint: {
            "circle-radius": 6,
            "circle-color": "#22c55e",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        } as any);

        // Optional symbol marker for unclustered to test pitch alignment consistency (hidden by default)
        try {
          if (!m.getLayer("places-unclustered-symbol")) {
            m.addLayer({
              id: "places-unclustered-symbol",
              type: "symbol",
              source: sourceId,
              filter: ["!has", "point_count"],
              layout: {
                "icon-image": ["coalesce", ["get", "icon"], "marker-15"],
                "icon-size": ["interpolate", ["linear"], ["zoom"], 10, 0.8, 16, 1.2],
                "icon-rotation-alignment": "map",
                "icon-pitch-alignment": "viewport",
                "icon-allow-overlap": true,
                "visibility": "none",
              },
              paint: {
                "icon-opacity": 0.9,
              },
            } as any);
          }
        } catch {}

        m.on("click", clusterLayer, (e: any) => {
          const features = m.queryRenderedFeatures(e.point, { layers: [clusterLayer] }) || [];
          const feature = features[0];
          if (!feature) return;
          const clusterId = feature.properties?.cluster_id;
          if (clusterId == null) return;
          (m.getSource(sourceId) as any).getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
            if (err) return;
            const coords = (feature.geometry as any).coordinates as [number, number];
            m.easeTo({ center: coords, zoom, duration: 400, easing: (t: number) => 1 - Math.pow(1 - t, 1.42) });
          });
        });

        m.on("click", unclustered, (e: any) => {
          const f = e.features?.[0];
          if (!f) return;
          const coords = f.geometry.coordinates as [number, number];
          const { title, description, addedBy } = f.properties || {};
          new mapboxgl.Popup({ offset: 25 })
            .setLngLat(coords)
            .setHTML(`<div class="p-2"><h3 class="font-semibold text-sm">${title || "Untitled"}</h3>${description ? `<p class=\"text-xs text-gray-600 mt-1\">${description}</p>` : ""}<p class="text-xs text-gray-500 mt-2">Added by ${addedBy || "unknown"}</p></div>`)
            .addTo(m);
        });
      } else {
        (m.getSource(sourceId) as any).setData(placesGeoJson as any);
      }
    };

    if (m.isStyleLoaded()) ensureLayers();
    else m.once("load", ensureLayers);
  }, [placesGeoJson, styleUrl, SHOW_PLACES]);

  // Nearby layer (non-clustered)
  const nearbyGeoJson = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: (nearbyPlaces || []).map((p) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] as [number, number] },
      properties: {
        title: p.title,
        description: p.description || "",
        distance_m: Math.round(p.distance_m || 0),
        addedBy: user.user_metadata?.display_name || user.email || "",
      },
    })),
  }), [nearbyPlaces, user]);

  useEffect(() => {
    if (!map.current || !SHOW_PLACES) return;
    const m = map.current;
    const sourceId = "nearby-src";
    const layerId = "nearby-circles";

    const ensureLayers = () => {
      if (!m.getSource(sourceId)) {
        m.addSource(sourceId, { type: "geojson", data: nearbyGeoJson as any } as any);
        m.addLayer({
          id: layerId,
          type: "circle",
          source: sourceId,
          paint: {
            "circle-radius": 5,
            "circle-color": "#10b981",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        } as any);
      } else {
        (m.getSource(sourceId) as any).setData(nearbyGeoJson as any);
      }
    };

    if (m.isStyleLoaded()) ensureLayers();
    else m.once("load", ensureLayers);
  }, [nearbyGeoJson, styleUrl, SHOW_PLACES]);

  // Apply interaction preferences when available
  useEffect(() => {
    if (!map.current) return;
    const applyInteraction = (prefs: any) => {
      try { prefs.dragRotate ? map.current?.dragRotate?.enable?.() : map.current?.dragRotate?.disable?.(); } catch {}
      try { prefs.touchZoomRotate ? map.current?.touchZoomRotate?.enable?.() : map.current?.touchZoomRotate?.disable?.(); } catch {}
      try { prefs.scrollZoom ? map.current?.scrollZoom?.enable?.() : map.current?.scrollZoom?.disable?.(); } catch {}
      try { prefs.keyboard ? map.current?.keyboard?.enable?.() : map.current?.keyboard?.disable?.(); } catch {}
      try { prefs.dragPan ? map.current?.dragPan?.enable?.() : map.current?.dragPan?.disable?.(); } catch {}
      try { if (map.current && (map.current as any).inertiaOptions) { (map.current as any).inertiaOptions.deceleration = prefs.inertia ? (map.current as any).inertiaOptions.deceleration : 0; } } catch {}
      try { if (map.current && (map.current as any)._handlers?.scrollZoom) { (map.current as any)._handlers.scrollZoom._speed = Math.max(0.01, (prefs.wheelZoomRate || 1.0)); } } catch {}
    };
    // From localStorage (fast) then hydrate via live events
    try {
      const raw = localStorage.getItem("user:prefs:map:interaction");
      if (raw) applyInteraction(JSON.parse(raw));
    } catch {}
    const onPrefs = (e: any) => {
      const inter = e?.detail?.interaction;
      if (inter) {
        applyInteraction(inter);
        try { localStorage.setItem("user:prefs:map:interaction", JSON.stringify(inter)); } catch {}
      }
    };
    window.addEventListener("map:prefs-change", onPrefs as any);
    return () => { window.removeEventListener("map:prefs-change", onPrefs as any); };
  }, []);

  // Persist last_view on interactions (debounced local cache only)
  useEffect(() => {
    if (!map.current) return;
    const m = map.current;
    const handler = () => {
      if (saveTimer.current) { window.clearTimeout(saveTimer.current); }
      saveTimer.current = window.setTimeout(async () => {
        const last = { center: m.getCenter().toArray() as [number, number], zoom: m.getZoom(), pitch: m.getPitch(), bearing: m.getBearing() };
        // Write cache immediately
        try { localStorage.setItem("map:last_view", JSON.stringify(last)); } catch {}
      }, 800) as unknown as number;
    };
    m.on("moveend", handler);
    m.on("pitchend", handler);
    m.on("rotateend", handler);
    return () => {
      m.off("moveend", handler);
      m.off("pitchend", handler);
      m.off("rotateend", handler);
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [styleUrl]);

  // Listen for live style changes from settings page
  useEffect(() => {
    const onChange = (e: any) => {
      const nextKey = e?.detail?.style_key as StyleKey | undefined;
      if (!nextKey || nextKey === styleKey) return;
      setStyleKey(nextKey);
      setStyleUrl(styleUrlFor(nextKey));
      try { localStorage.setItem("map:style_key", nextKey); } catch {}
    };
    window.addEventListener("map:style-change", onChange as any);
    return () => { window.removeEventListener("map:style-change", onChange as any); };
  }, [styleKey]);

  // onSubmitPlace and related modal handlers removed

  return (
    <div className="relative h-screen">
      {/* Style switcher + Theme HUD */}
      <div className="absolute top-4 left-4 z-30 bg-white/80 backdrop-blur px-2 py-1 rounded shadow pointer-events-none">
        <label className="text-xs text-gray-600 mr-2">Style</label>
        <select
          className="text-sm border rounded px-2 py-1 bg-white pointer-events-auto"
          value={styleKey}
          onChange={(e) => {
            const nextKey = e.target.value as StyleKey;
            applyStyleKey(nextKey);
            try { window.dispatchEvent(new CustomEvent("map:style-change", { detail: { style_key: nextKey } })); } catch {}
          }}
        >
          {styles.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        {/* Theme HUD for debugging themed vs skipped */}
        <div className="mt-2 text-[10px] text-gray-700 grid grid-cols-2 gap-1">
          <div>
            <div className="font-semibold">Water</div>
            <div className="truncate max-w-[160px]" title={themeInfo.water.join(", ")}>{themeInfo.water.join(", ") || "-"}</div>
          </div>
          <div>
            <div className="font-semibold">Parks</div>
            <div className="truncate max-w-[160px]" title={themeInfo.parks.join(", ")}>{themeInfo.parks.join(", ") || (styleKey === 'satellite' ? "(skipped)" : "-")}</div>
          </div>
          <div>
            <div className="font-semibold">Roads</div>
            <div className="truncate max-w-[160px]" title={themeInfo.roads.join(", ")}>{themeInfo.roads.join(", ") || (styleKey === 'satellite' ? "(skipped)" : "-")}</div>
          </div>
          <div>
            <div className="font-semibold">Labels</div>
            <div className="truncate max-w-[160px]" title={themeInfo.labels.join(", ")}>{themeInfo.labels.join(", ") || "-"}</div>
          </div>
          <div>
            <div className="font-semibold">Transit</div>
            <div className="truncate max-w-[160px]" title={themeInfo.transit.join(", ")}>{themeInfo.transit.join(", ") || "-"}</div>
          </div>
          <div>
            <div className="font-semibold">Buildings</div>
            <div className="truncate max-w-[160px]" title={themeInfo.buildings.join(", ")}>{themeInfo.buildings.join(", ") || "-"}</div>
          </div>
        </div>
      </div>

      <div ref={mapContainer} className="h-[calc(100vh-64px)] w-full" />
      <MapVignetteOverlay />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center bg-white/70 rounded-md p-3 shadow">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading map...</p>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          </div>
        </div>
      )}
      
      {/* Nearby Places Control */}
      <div className="absolute top-4 right-4 z-30 pointer-events-none">
        <Button
          onClick={() => {
            if (map.current) {
              const center = map.current.getCenter();
              loadNearbyPlaces(center.lat, center.lng, 2000);
            }
          }}
          disabled={isLoadingNearby}
          className="bg-green-600 hover:bg-green-700 text-white shadow-lg pointer-events-auto"
        >
          {isLoadingNearby ? "Loading..." : "Find Nearby (2km)"}
        </Button>
      </div>
      
      {/* Add-new-place functionality intentionally removed for now */}
    </div>
  )
}
