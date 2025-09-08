"use client";

import { useEffect, useRef } from "react";

type FeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: { type: "Point"; coordinates: [number, number] };
    properties?: { title?: string; short_title?: string; capacity?: number } & Record<string, any>;
  }>;
};

export default function HousePins({ map, data, idPrefix = 'houses' }: { map: any; data: FeatureCollection; idPrefix?: string; }) {
  const popupRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !map.getStyle?.()) return;
    const sourceId = `${idPrefix}-src`;
    const baseLayer = `${idPrefix}-symbol`;

    const ensure = () => {
      try {
        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, { type: 'geojson', data: data as any });
        } else {
          (map.getSource(sourceId) as any).setData(data as any);
        }
        if (!map.getLayer(baseLayer)) {
          map.addLayer({
            id: baseLayer,
            type: 'symbol',
            source: sourceId,
            layout: {
              "icon-image": ["coalesce", ["get", "icon"], "lodging-15"],
              "icon-size": ["interpolate", ["linear"], ["zoom"], 10, 0.9, 16, 1.2],
              "icon-rotation-alignment": "map",
              "icon-pitch-alignment": "viewport",
              "text-field": ["to-string", ["get", "capacity"]],
              "text-size": 10,
              "text-offset": [0.6, -0.6],
              "text-anchor": "left",
            },
            paint: {
              "icon-opacity": 0.95,
              "text-halo-width": 1,
              "text-halo-color": "#ffffff",
              "text-color": "#0f172a",
            },
          });
        }

        const onEnter = (e: any) => {
          const f = e.features?.[0]; if (!f) return; map.getCanvas().style.cursor = 'pointer';
          const coords = f.geometry.coordinates as [number, number];
          const title = f.properties?.short_title || f.properties?.title || 'House';
          if (!popupRef.current) popupRef.current = new (window as any).mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 16 });
          popupRef.current.setLngLat(coords).setHTML(`<div class=\"text-xs font-medium\">${title}</div>`).addTo(map);
        };
        const onLeave = () => { map.getCanvas().style.cursor = ''; try { popupRef.current?.remove?.(); } catch {} };
        map.on('mouseenter', baseLayer, onEnter);
        map.on('mouseleave', baseLayer, onLeave);
        return () => {
          try { map.off('mouseenter', baseLayer, onEnter); } catch {}
          try { map.off('mouseleave', baseLayer, onLeave); } catch {}
        };
      } catch {}
    };

    if (map.isStyleLoaded()) { const cleanup = ensure(); return cleanup; }
    else { const handler = () => ensure(); map.once('load', handler); return () => { try { map.off('load', handler); } catch {} }; }
  }, [map, data, idPrefix]);

  return null;
}


