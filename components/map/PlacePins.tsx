"use client";

import { useEffect, useRef } from "react";

type FeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: { type: "Point"; coordinates: [number, number] };
    properties?: Record<string, any>;
  }>;
};

interface PlacePinsProps {
  map: any; // mapboxgl.Map
  data: FeatureCollection;
  idPrefix?: string;
}

export default function PlacePins({ map, data, idPrefix = "places" }: PlacePinsProps) {
  const popupRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !map.getStyle?.()) return;
    const sourceId = `${idPrefix}-src`;
    const clusterLayer = `${idPrefix}-clusters`;
    const clusterCount = `${idPrefix}-cluster-count`;
    const unclustered = `${idPrefix}-unclustered`;

    const ensure = () => {
      try {
        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: "geojson",
            data: data as any,
            cluster: true,
            clusterRadius: 60,
            clusterMaxZoom: 14,
          });
        } else {
          (map.getSource(sourceId) as any).setData(data as any);
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
                "#93c5fd",
                10, "#60a5fa",
                25, "#3b82f6",
                50, "#2563eb",
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
            paint: { "text-color": "#0f172a" },
          });
        }

        if (!map.getLayer(unclustered)) {
          map.addLayer({
            id: unclustered,
            type: "symbol",
            source: sourceId,
            filter: ["!has", "point_count"],
            layout: {
              "icon-image": ["coalesce", ["get", "icon"], "marker-15"],
              "icon-size": ["interpolate", ["linear"], ["zoom"], 10, 0.8, 16, 1.2],
              "icon-rotation-alignment": "map",
              "icon-pitch-alignment": "viewport",
              "icon-allow-overlap": true,
            },
            paint: {
              "icon-opacity": 0.95,
            },
          });
        }

        // Interactions: zoom on cluster, popup on single
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
        const onSingleEnter = (e: any) => {
          const f = e.features?.[0];
          if (!f) return;
          map.getCanvas().style.cursor = 'pointer';
          const coords = f.geometry.coordinates as [number, number];
          const title = f.properties?.title || 'Untitled';
          if (!popupRef.current) popupRef.current = new (window as any).mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 16 });
          popupRef.current.setLngLat(coords).setHTML(`<div class="text-xs font-medium">${title}</div>`).addTo(map);
        };
        const onSingleLeave = () => {
          map.getCanvas().style.cursor = '';
          try { popupRef.current?.remove?.(); } catch {}
        };

        map.on("click", clusterLayer, onClusterClick);
        map.on("mouseenter", unclustered, onSingleEnter);
        map.on("mouseleave", unclustered, onSingleLeave);

        return () => {
          try { map.off("click", clusterLayer, onClusterClick); } catch {}
          try { map.off("mouseenter", unclustered, onSingleEnter); } catch {}
          try { map.off("mouseleave", unclustered, onSingleLeave); } catch {}
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
  }, [map, data, idPrefix]);

  return null;
}


