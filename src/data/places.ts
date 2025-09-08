"use server";

import { supabaseServer } from "@/lib/supabase/server";

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

type Bbox = [[number, number], [number, number]] | null;

export type PlaceLite = {
  id: string;
  title: string;
  description: string | null;
  lat: number;
  lng: number;
  created_at: string;
};

// Simple in-memory tile-ish cache keyed by rounded bbox (4 decimals)
const bboxCache = new Map<string, PlaceLite[]>();

function round4(n: number) { return Math.round(n * 1e4) / 1e4; }
function keyFor(bounds: Bbox): string | null {
  if (!bounds) return null;
  const [[minLng, minLat], [maxLng, maxLat]] = bounds;
  return [round4(minLng), round4(minLat), round4(maxLng), round4(maxLat)].join(",");
}

export async function listPlaces(bounds?: Bbox): Promise<Result<PlaceLite[]>> {
  try {
    const supabase = supabaseServer();
    const k = keyFor(bounds || null);
    if (k && bboxCache.has(k)) {
      return { ok: true, data: bboxCache.get(k)! };
    }

    let query = supabase
      .from('places')
      .select('id, title, description, lat, lng, created_at')
      .order('created_at', { ascending: false }) as any;
    if (bounds) {
      const [[minLng, minLat], [maxLng, maxLat]] = bounds;
      query = query.gte('lat', minLat).lte('lat', maxLat).gte('lng', minLng).lte('lng', maxLng);
    }
    const { data, error } = await query;
    if (error) return { ok: false, error: error.message };
    const rows = (data || []) as PlaceLite[];
    if (k) bboxCache.set(k, rows);
    return { ok: true, data: rows };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Unknown error' };
  }
}


