"use client";

import { useEffect, useMemo, useRef } from "react";

type FeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: { type: "Point"; coordinates: [number, number] };
    properties?: Record<string, any>;
  }>;
};

interface MeetupPinsProps {
  map: any; // mapboxgl.Map
  data: FeatureCollection; // expects properties.title and properties.starts_at (ISO) when available
  idPrefix?: string;
}

function isSoon(iso?: string): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  if (isNaN(t)) return false;
  const diff = t - Date.now();
  return diff > 0 && diff <= 24 * 60 * 60 * 1000;
}

export default function MeetupPins({ map, data, idPrefix = "meetups" }: MeetupPinsProps) {
  const popupRef = useRef<any>(null);

  // Decorate data with a 'soon' boolean for styling
  const decorated = useMemo<FeatureCollection>(() => {
    try {
      return {
        type: "FeatureCollection",
        features: (data?.features || []).map((f) => ({
          ...f,
          properties: {
            ...(f.properties || {}),
            soon: isSoon((f.properties || {}).starts_at as string | undefined),
          },
        })),
      };
    } catch {
      return data;
    }
  }, [data]);

  useEffect(() => {
    if (!map || !map.getStyle?.()) return;
    const sourceId = `${idPrefix}-src`;
    const clusterLayer = `${idPrefix}-clusters`;
    const clusterCount = `${idPrefix}-cluster-count`;
    const unclustered = `${idPrefix}-unclustered`;
    const soonLayer = `${idPrefix}-soon`;

    const ensure = () => {
      try {
        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: "geojson",
            data: decorated as any,
            cluster: true,
            clusterRadius: 60,
            clusterMaxZoom: 14,
          });
        } else {
          (map.getSource(sourceId) as any).setData(decorated as any);
        }

        if (!map.getLayer(clusterLayer)) {
          map.addLayer({
            id: clusterLayer,
            type: "circle",
            source: sourceId,
            filter: ["has", "point_count"],
            paint: {
              "circle-color": [
                "step",
                ["get", "point_count"],
                "#fde68a",
                10, "#fbbf24",
                25, "#f59e0b",
                50, "#d97706",
              ],
              "circle-radius": ["step", ["get", "point_count"], 16, 25, 22, 50, 28],
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
            },
          });
        }

        if (!map.getLayer(clusterCount)) {
          map.addLayer({
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
            paint: { "text-color": "#1f2937" },
          });
        }

        if (!map.getLayer(unclustered)) {
          map.addLayer({
            id: unclustered,
            type: "circle",
            source: sourceId,
            filter: ["all", ["!has", "point_count"], ["!", ["get", "soon"]]],
            paint: {
              "circle-radius": 6,
              "circle-color": "#f59e0b",
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
            },
          });
        }

        if (!map.getLayer(soonLayer)) {
          map.addLayer({
            id: soonLayer,
            type: "symbol",
            source: sourceId,
            filter: ["all", ["!has", "point_count"], ["get", "soon"]],
            layout: {
              "icon-image": ["coalesce", ["get", "icon"], "star-15"],
              "icon-size": ["interpolate", ["linear"], ["zoom"], 10, 0.9, 16, 1.2],
              "icon-rotation-alignment": "map",
              "icon-pitch-alignment": "viewport",
              "icon-allow-overlap": true,
            },
            paint: {
              "icon-opacity": 0.95,
            },
          });
        }

        // Interactions
        const onClusterClick = (e: any) => {
          const features = map.queryRenderedFeatures(e.point, { layers: [clusterLayer] }) || [];
          const feature = features[0];
          if (!feature) return;
          const cid = feature.properties?.cluster_id;
          if (cid == null) return;
          (map.getSource(sourceId) as any).getClusterExpansionZoom(cid, (err: any, zoom: number) => {
            if (err) return;
            const coords = (feature.geometry as any).coordinates as [number, number];
            map.easeTo({ center: coords, zoom, duration: 400, easing: (t: number) => 1 - Math.pow(1 - t, 1.42) });
          });
        };
        const showPopup = (f: any) => {
          const coords = f.geometry.coordinates as [number, number];
          const title = f.properties?.title || 'Untitled';
          const when = f.properties?.starts_at ? new Date(f.properties.starts_at).toLocaleString() : '';
          if (!popupRef.current) popupRef.current = new (window as any).mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 16 });
          popupRef.current.setLngLat(coords).setHTML(`<div class=\"text-xs\"><div class=\"font-medium\">${title}</div>${when ? `<div class=\"text-[10px] text-gray-500\">${when}</div>` : ''}</div>`).addTo(map);
        };
        const onEnter = (e: any) => { const f = e.features?.[0]; if (!f) return; map.getCanvas().style.cursor = 'pointer'; showPopup(f); };
        const onLeave = () => { map.getCanvas().style.cursor = ''; try { popupRef.current?.remove?.(); } catch {} };

        map.on("click", clusterLayer, onClusterClick);
        map.on("mouseenter", unclustered, onEnter);
        map.on("mouseleave", unclustered, onLeave);
        map.on("mouseenter", soonLayer, onEnter);
        map.on("mouseleave", soonLayer, onLeave);

        return () => {
          try { map.off("click", clusterLayer, onClusterClick); } catch {}
          try { map.off("mouseenter", unclustered, onEnter); } catch {}
          try { map.off("mouseleave", unclustered, onLeave); } catch {}
          try { map.off("mouseenter", soonLayer, onEnter); } catch {}
          try { map.off("mouseleave", soonLayer, onLeave); } catch {}
        };
      } catch {}
    };

    if (map.isStyleLoaded()) {
      const cleanup = ensure();
      return cleanup;
    } else {
      const handler = () => ensure();
      map.once('load', handler);
      return () => { try { map.off('load', handler); } catch {} };
    }
  }, [map, decorated, idPrefix]);

  return null;
}


