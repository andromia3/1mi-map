"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { toast } from "@/lib/toast";

type StyleKey = "default" | "night" | "satellite";

export default function MapSettingsPage() {
  const [styleKey, setStyleKey] = useState<StyleKey>("default");
  const [saving, setSaving] = useState(false);
  const [buildings3d, setBuildings3d] = useState(true);
  const [showTransit, setShowTransit] = useState(true);
  const [labelDensity, setLabelDensity] = useState(1.0);
  const [roadContrast, setRoadContrast] = useState(1.0);
  const [dragRotate, setDragRotate] = useState(false);
  const [touchZoomRotate, setTouchZoomRotate] = useState(true);
  const [scrollZoom, setScrollZoom] = useState(true);
  const [keyboard, setKeyboard] = useState(true);
  const [dragPan, setDragPan] = useState(true);
  const [inertia, setInertia] = useState(true);
  const [wheelZoomRate, setWheelZoomRate] = useState(1.0);

  // Hydrate initial from localStorage for instant UX, then confirm from Supabase
  useEffect(() => {
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("map:style_key") as StyleKey | null;
      if (local === "default" || local === "night" || local === "satellite") {
        setStyleKey(local);
      }
    }
    (async () => {
      try {
        const supabase = supabaseBrowser();
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) return;
        const { data: settings } = await supabase
          .from("user_settings")
          .select("map")
          .eq("user_id", userId)
          .single();
        const map = (settings?.map as any) || {};
        const remote = map?.style_key as StyleKey | undefined;
        if (remote === "default" || remote === "night" || remote === "satellite") {
          setStyleKey(remote);
          try { localStorage.setItem("map:style_key", remote); } catch {}
        }
        if (typeof map.buildings_3d === "boolean") setBuildings3d(Boolean(map.buildings_3d));
        if (typeof map.show_transit === "boolean") setShowTransit(Boolean(map.show_transit));
        if (typeof map.label_density === "number") setLabelDensity(Number(map.label_density));
        if (typeof map.road_contrast === "number") setRoadContrast(Number(map.road_contrast));
        const inter = map.interaction || {};
        if (typeof inter.dragRotate === "boolean") setDragRotate(Boolean(inter.dragRotate));
        if (typeof inter.touchZoomRotate === "boolean") setTouchZoomRotate(Boolean(inter.touchZoomRotate));
        if (typeof inter.scrollZoom === "boolean") setScrollZoom(Boolean(inter.scrollZoom));
        if (typeof inter.keyboard === "boolean") setKeyboard(Boolean(inter.keyboard));
        if (typeof inter.dragPan === "boolean") setDragPan(Boolean(inter.dragPan));
        if (typeof inter.inertia === "boolean") setInertia(Boolean(inter.inertia));
        if (typeof inter.wheelZoomRate === "number") setWheelZoomRate(Number(inter.wheelZoomRate));
      } catch {
        toast("Couldn’t load settings. Using cached.");
      }
    })();
  }, []);

  const onChangeStyle = async (next: StyleKey) => {
    if (next === styleKey) return;
    setStyleKey(next);
    try { localStorage.setItem("map:style_key", next); } catch {}
    setSaving(true);
    try {
      const supabase = supabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (userId) {
        await supabase.from("user_settings").upsert({ user_id: userId, map: { style_key: next } } as any, { onConflict: "user_id" } as any);
      }
      toast.success("Style saved");
    } catch {
      toast.error("Failed to save style");
    }
    setSaving(false);
    try { window.dispatchEvent(new CustomEvent("map:style-change", { detail: { style_key: next } })); } catch {}
  };

  const persistPrefs = async (partial: Partial<{ buildings_3d: boolean; show_transit: boolean; label_density: number; road_contrast: number }>) => {
    setSaving(true);
    try {
      const supabase = supabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (userId) {
        await supabase.from("user_settings").upsert({
          user_id: userId,
          map: {
            style_key: styleKey,
            buildings_3d: buildings3d,
            show_transit: showTransit,
            label_density: labelDensity,
            road_contrast: roadContrast,
            ...partial,
            interaction: {
              dragRotate,
              touchZoomRotate,
              scrollZoom,
              keyboard,
              dragPan,
              inertia,
              wheelZoomRate,
            }
          }
        } as any, { onConflict: "user_id" } as any);
      }
      toast.success("Preferences saved");
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
    try { window.dispatchEvent(new CustomEvent("map:prefs-change", { detail: { ...partial, interaction: { dragRotate, touchZoomRotate, scrollZoom, keyboard, dragPan, inertia, wheelZoomRate } } })); } catch {}
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <h1 className="text-xl font-semibold">Map</h1>
      <div className="space-y-2">
        <label className="block text-sm text-gray-700">Base style</label>
        <select
          className="border rounded px-2 py-1 bg-white"
          value={styleKey}
          onChange={(e) => onChangeStyle(e.target.value as StyleKey)}
          disabled={saving}
        >
          <option value="default">Default</option>
          <option value="night">Night</option>
          <option value="satellite">Satellite</option>
        </select>
        {saving && <p className="text-xs text-gray-500">Saving…</p>}
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-gray-700">3D buildings</label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={buildings3d} onChange={(e) => { setBuildings3d(e.target.checked); persistPrefs({ buildings_3d: e.target.checked }); }} />
          <span>Enable 3D buildings</span>
        </label>
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-gray-700">Transit</label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showTransit} onChange={(e) => { setShowTransit(e.target.checked); persistPrefs({ show_transit: e.target.checked }); }} />
          <span>Show transit lines</span>
        </label>
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-gray-700">Label density <span className="text-xs text-gray-500">{labelDensity.toFixed(2)}x</span></label>
        <input type="range" min={0.8} max={1.4} step={0.05} value={labelDensity} onChange={(e) => { const v = parseFloat(e.target.value); setLabelDensity(v); }} onMouseUp={() => persistPrefs({ label_density: labelDensity })} onTouchEnd={() => persistPrefs({ label_density: labelDensity })} />
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-gray-700">Road contrast <span className="text-xs text-gray-500">{roadContrast.toFixed(2)}x</span></label>
        <input type="range" min={0.8} max={1.2} step={0.05} value={roadContrast} onChange={(e) => { const v = parseFloat(e.target.value); setRoadContrast(v); }} onMouseUp={() => persistPrefs({ road_contrast: roadContrast })} onTouchEnd={() => persistPrefs({ road_contrast: roadContrast })} />
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium">Interaction</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={dragRotate} onChange={(e) => { setDragRotate(e.target.checked); persistPrefs({}); }} /> Drag rotate</label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={touchZoomRotate} onChange={(e) => { setTouchZoomRotate(e.target.checked); persistPrefs({}); }} /> Touch zoom/rotate</label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={scrollZoom} onChange={(e) => { setScrollZoom(e.target.checked); persistPrefs({}); }} /> Scroll zoom</label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={keyboard} onChange={(e) => { setKeyboard(e.target.checked); persistPrefs({}); }} /> Keyboard</label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={dragPan} onChange={(e) => { setDragPan(e.target.checked); persistPrefs({}); }} /> Drag pan</label>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={inertia} onChange={(e) => { setInertia(e.target.checked); persistPrefs({}); }} /> Inertia</label>
        </div>
        <label className="block text-sm text-gray-700">Wheel zoom rate <span className="text-xs text-gray-500">{wheelZoomRate.toFixed(2)}x</span></label>
        <input type="range" min={0.5} max={2} step={0.1} value={wheelZoomRate} onChange={(e) => { const v = parseFloat(e.target.value); setWheelZoomRate(v); }} onMouseUp={() => persistPrefs({})} onTouchEnd={() => persistPrefs({})} />
      </div>
    </div>
  );
}


