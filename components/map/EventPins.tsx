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

interface EventPinsProps {
  map: any; // mapboxgl.Map
  data: FeatureCollection; // expects properties.title and booking_open_at/booking_close_at ISO
  idPrefix?: string;
}

function isBookingOpen(props: any): boolean {
  try {
    const now = Date.now();
    const open = props?.booking_open_at ? Date.parse(props.booking_open_at) : undefined;
    const close = props?.booking_close_at ? Date.parse(props.booking_close_at) : undefined;
    if (open && open > now) return false;
    if (close && close < now) return false;
    return !!open || props?.capacity != null; // treat as open if open time passed
  } catch { return false; }
}

export default function EventPins({ map, data, idPrefix = "events" }: EventPinsProps) {
  const popupRef = useRef<any>(null);

  const decorated = useMemo<FeatureCollection>(() => ({
    type: "FeatureCollection",
    features: (data?.features || []).map((f) => ({
      ...f,
      properties: { ...(f.properties || {}), booking_open_now: isBookingOpen(f.properties || {}) },
    })),
  }), [data]);

  useEffect(() => {
    if (!map || !map.getStyle?.()) return;
    const sourceId = `${idPrefix}-src`;
    const clusterLayer = `${idPrefix}-clusters`;
    const clusterCount = `${idPrefix}-cluster-count`;
    const unclustered = `${idPrefix}-unclustered`;
    const openLayer = `${idPrefix}-open`;

    const ensure = () => {
      try {
        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, { type: "geojson", data: decorated as any, cluster: true, clusterRadius: 60, clusterMaxZoom: 14 });
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
              "circle-color": ["step", ["get", "point_count"], "#99f6e4", 10, "#5eead4", 25, "#2dd4bf", 50, "#14b8a6"],
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
            paint: { "text-color": "#134e4a" },
          });
        }

        if (!map.getLayer(unclustered)) {
          map.addLayer({
            id: unclustered,
            type: "circle",
            source: sourceId,
            filter: ["all", ["!has", "point_count"], ["!", ["get", "booking_open_now"]]],
            paint: {
              "circle-radius": 6,
              "circle-color": "#14b8a6",
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
            },
          });
        }

        if (!map.getLayer(openLayer)) {
          map.addLayer({
            id: openLayer,
            type: "circle",
            source: sourceId,
            filter: ["all", ["!has", "point_count"], ["get", "booking_open_now"]],
            paint: {
              "circle-radius": 6,
              "circle-color": "#0ea5e9",
              "circle-stroke-width": 3,
              "circle-stroke-color": "#38bdf8",
            },
          });
        }

        const showPopup = (f: any) => {
          const coords = f.geometry.coordinates as [number, number];
          const title = f.properties?.title || 'Untitled';
          const when = f.properties?.starts_at ? new Date(f.properties.starts_at).toLocaleString() : '';
          if (!popupRef.current) popupRef.current = new (window as any).mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 16 });
          popupRef.current.setLngLat(coords).setHTML(`<div class=\"text-xs\"><div class=\"font-medium\">${title}</div>${when ? `<div class=\"text-[10px] text-gray-500\">${when}</div>` : ''}</div>`).addTo(map);
        };
        const onEnter = (e: any) => { const f = e.features?.[0]; if (!f) return; map.getCanvas().style.cursor = 'pointer'; showPopup(f); };
        const onLeave = () => { map.getCanvas().style.cursor = ''; try { popupRef.current?.remove?.(); } catch {} };

        map.on("mouseenter", unclustered, onEnter);
        map.on("mouseleave", unclustered, onLeave);
        map.on("mouseenter", openLayer, onEnter);
        map.on("mouseleave", openLayer, onLeave);

        return () => {
          try { map.off("mouseenter", unclustered, onEnter); } catch {}
          try { map.off("mouseleave", unclustered, onLeave); } catch {}
          try { map.off("mouseenter", openLayer, onEnter); } catch {}
          try { map.off("mouseleave", openLayer, onLeave); } catch {}
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


