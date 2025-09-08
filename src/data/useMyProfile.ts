"use client";

import useSWR from 'swr';
import { supabaseBrowser } from '@/lib/supabase/browser';

export type MyProfile = {
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

async function fetchProfile(): Promise<MyProfile | null> {
  const supabase = supabaseBrowser();
  const { data: { session } } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, city, timezone, image_url, bio, linkedin_url, instagram_url, x_url, youtube_url, website_url')
    .eq('id', uid)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as any) || null;
}

export function useMyProfile() {
  const { data, error, isLoading, mutate } = useSWR<MyProfile | null>('my-profile', fetchProfile, {
    revalidateOnFocus: false,
  });

  async function update(fields: Partial<MyProfile>) {
    // Optimistic update with rollback
    const supabase = supabaseBrowser();
    await mutate(async (currentData) => {
      const current = (currentData ?? null) as MyProfile | null;
      const optimistic = current ? { ...current, ...fields } : (fields as MyProfile);
      const { data: sessionRes } = await supabase.auth.getSession();
      const uid = sessionRes.session?.user?.id;
      if (!uid) throw new Error('Not authenticated');
      const payload = { id: uid, ...fields } as any;
      const { error: upErr } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
      if (upErr) throw new Error(upErr.message);
      return optimistic;
    }, { optimisticData: data ? { ...data, ...fields } : (fields as any), rollbackOnError: true, revalidate: false });
  }

  return { profile: data, isLoading, error, update };
}


