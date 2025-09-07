"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { Database } from "@/lib/supabase/types";

const addPlaceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

type AddPlaceFormData = z.infer<typeof addPlaceSchema>;
type Place = Database["public"]["Tables"]["places"]["Row"];
type NearbyPlace = Database["public"]["Functions"]["nearby_places"]["Returns"][0];

interface MapViewProps {
  user: { id: string; email?: string; user_metadata?: { display_name?: string } };
}

export default function MapView({ user }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [clickedLngLat, setClickedLngLat] = useState<[number, number] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [error, setError] = useState("");
  const [userCenter, setUserCenter] = useState<[number, number] | null>(null);
  const styles = [
    { id: "streets", label: "Streets", url: "mapbox://styles/mapbox/streets-v12" },
    { id: "light", label: "Light", url: "mapbox://styles/mapbox/light-v11" },
    { id: "dark", label: "Dark", url: "mapbox://styles/mapbox/dark-v11" },
    { id: "satellite", label: "Satellite", url: "mapbox://styles/mapbox/satellite-streets-v12" },
  ];
  const [styleUrl, setStyleUrl] = useState<string>(styles[0].url);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddPlaceFormData>({
    resolver: zodResolver(addPlaceSchema),
  })

  // Get user location first
  useEffect(() => {
    const fallback: [number, number] = [-0.1276, 51.5072];
    if (typeof window === "undefined" || userCenter !== null) return;
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
  }, [userCenter, styleUrl]);

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
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: styleUrl,
        center: userCenter,
        zoom: 12,
        antialias: false,
        dragRotate: false,
        pitchWithRotate: false,
        attributionControl: false,
        cooperativeGestures: true,
      });
      map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-left");
      map.current.addControl(new mapboxgl.ScaleControl({ unit: "metric" }), "bottom-left");
      map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
      map.current.addControl(new mapboxgl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true, showUserHeading: true }), "top-left");
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

    map.current.on("load", () => {
      console.log("[map] event:load fired, styleLoaded=", map.current?.isStyleLoaded?.());
      setIsLoading(false);
      map.current?.resize();
      window.clearTimeout(timeoutId);
      window.clearTimeout(quickId);
    });
    map.current.on("error", (e) => {
      console.error("[map] event:error", e);
      setError("Failed to load map. Check Mapbox token and network.");
      setIsLoading(false);
      window.clearTimeout(timeoutId);
      window.clearTimeout(quickId);
    });
    map.current.on("click", (e) => {
      setClickedLngLat([e.lngLat.lng, e.lngLat.lat]);
      setShowAddPlace(true);
    });

    return () => {
      if (map.current) {
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

  // Add markers to map
  useEffect(() => {
    if (!map.current || places.length === 0) return

    // Clear existing markers
    const existingMarkers = document.querySelectorAll(".map-marker")
    existingMarkers.forEach(marker => marker.remove())

    places.forEach(() => {})
  }, [places, user])

  // Add nearby places markers (different color)
  useEffect(() => {
    if (!map.current || nearbyPlaces.length === 0) return

    // Clear existing nearby markers
    const existingNearbyMarkers = document.querySelectorAll(".nearby-marker")
    existingNearbyMarkers.forEach(marker => marker.remove())

    nearbyPlaces.forEach(place => {
      const markerEl = document.createElement("div")
      markerEl.className = "nearby-marker"
      markerEl.style.cssText = `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #10b981;
        border: 2px solid white;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      `

      const popup = new mapboxgl.Popup({ offset: 25 })
        .setHTML(`
          <div class="p-2">
            <h3 class="font-semibold text-sm">${place.title}</h3>
            ${place.description ? `<p class="text-xs text-gray-600 mt-1">${place.description}</p>` : ''}
            <p class="text-xs text-gray-500 mt-1">${Math.round(place.distance_m)}m away</p>
            <p class="text-xs text-gray-500">Added by ${user.user_metadata?.display_name || user.email}</p>
          </div>
        `)

      new mapboxgl.Marker(markerEl)
        .setLngLat([place.lng, place.lat])
        .setPopup(popup)
        .addTo(map.current!)
    })
  }, [nearbyPlaces, user])

  const onSubmitPlace = async (data: AddPlaceFormData) => {
    if (!clickedLngLat) return;

    setIsSubmitting(true);
    setError("");

    try {
      const supabase = supabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError("You must be logged in to add places");
        return;
      }

      const { data: newPlace, error } = await (supabase as any)
        .from("places")
        .insert({
          title: data.title,
          description: data.description,
          lat: clickedLngLat[1],
          lng: clickedLngLat[0],
          created_by: session.user.id,
        })
        .select()
        .single();

      if (error) {
        setError(error.message);
      } else {
        setPlaces(prev => [newPlace, ...prev]);
        setShowAddPlace(false);
        setClickedLngLat(null);
        reset();
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseAddPlace = () => {
    setShowAddPlace(false)
    setClickedLngLat(null)
    reset()
    setError("")
  }

  return (
    <div className="relative h-screen">
      {/* Style switcher */}
      <div className="absolute top-4 left-4 z-30 bg-white/80 backdrop-blur px-2 py-1 rounded shadow">
        <label className="text-xs text-gray-600 mr-2">Style</label>
        <select
          className="text-sm border rounded px-2 py-1 bg-white"
          value={styleUrl}
          onChange={(e) => setStyleUrl(e.target.value)}
        >
          {styles.map((s) => (
            <option key={s.id} value={s.url}>{s.label}</option>
          ))}
        </select>
      </div>

      <div ref={mapContainer} className="h-[calc(100vh-64px)] w-full" />

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
      <div className="absolute top-4 right-4 z-30">
        <Button
          onClick={() => {
            if (map.current) {
              const center = map.current.getCenter();
              loadNearbyPlaces(center.lat, center.lng, 2000);
            }
          }}
          disabled={isLoadingNearby}
          className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
        >
          {isLoadingNearby ? "Loading..." : "Find Nearby (2km)"}
        </Button>
      </div>
      
      {showAddPlace && clickedLngLat && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-40">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Add Nice Place</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseAddPlace}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>
                Add a place at {clickedLngLat[1].toFixed(4)}, {clickedLngLat[0].toFixed(4)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmitPlace)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter place title"
                    {...register("title")}
                    disabled={isSubmitting}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter place description"
                    {...register("description")}
                    disabled={isSubmitting}
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseAddPlace}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? "Adding..." : "Add Place"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
