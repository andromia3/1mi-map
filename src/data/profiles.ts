"use server";

import { supabaseServer } from "@/lib/supabase/server";

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

type ProfileRow = {
  id: string;
  display_name: string | null;
  city: string | null;
  timezone: string | null;
  image_url: string | null;
  bio: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  x_url: string | null;
  youtube_url: string | null;
  website_url: string | null;
};

export async function getMyProfile(): Promise<Result<ProfileRow | null>> {
  try {
    const supabase = supabaseServer();
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) return { ok: true, data: null };
    const { data, error } = await (supabase
      .from("profiles")
      .select("id, display_name, city, timezone, image_url, bio, linkedin_url, instagram_url, x_url, youtube_url, website_url") as any)
      .eq("id", uid)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data as any) || null };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Unknown error" };
  }
}

export async function upsertMyProfile(fields: Partial<ProfileRow>): Promise<Result<ProfileRow>> {
  try {
    const supabase = supabaseServer();
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id;
    if (!uid) return { ok: false, error: "Not authenticated" };
    const payload = { id: uid, ...fields } as any;
    const { data, error } = await (supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("id, display_name, city, timezone, image_url, bio, linkedin_url, instagram_url, x_url, youtube_url, website_url") as any)
      .eq("id", uid)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as any };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Unknown error" };
  }
}


