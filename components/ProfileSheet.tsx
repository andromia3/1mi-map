"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProfileData {
  display_name: string | null;
  username: string | null;
  image_url: string | null;
  city: string | null;
  timezone: string | null;
  bio: string | null;
  website?: string | null;
  twitter?: string | null;
  instagram?: string | null;
  tier?: string | null;
}

export default function ProfileSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfileData | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const supabase = supabaseBrowser();
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) { setLoading(false); return; }
        const { data: profile } = await supabase.from("profiles").select("display_name, username, image_url, city, timezone, bio, website, twitter, instagram").eq("id", userId).single();
        const { data: membership } = await supabase.from("app_memberships").select("tier").eq("user_id", userId).maybeSingle();
        setData({ ...(profile as any), tier: membership?.tier || null });
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  const signOut = async () => {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const initials = (data?.display_name || data?.username || "").split(" ").map(s => s[0]).join("").slice(0,2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded w-32" />
                <div className="h-3 bg-gray-100 rounded w-20 mt-2" />
              </div>
            </div>
            <div className="h-3 bg-gray-100 rounded w-40" />
            <div className="h-16 bg-gray-100 rounded" />
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                {data.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.image_url} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm text-gray-700">{initials}</span>
                )}
              </div>
              <div>
                <div className="font-medium">{data.display_name || "Unnamed"}</div>
                <div className="text-xs text-gray-600">@{data.username || "username"}</div>
              </div>
              {data.tier && <div className="ml-auto text-xs px-2 py-1 rounded bg-gray-100">{data.tier}</div>}
            </div>
            <div className="text-xs text-gray-600">{[data.city, data.timezone].filter(Boolean).join(" • ")}</div>
            {data.bio && <div className="text-sm text-gray-800 line-clamp-4">{data.bio}</div>}
            <div className="flex items-center gap-3 text-sm">
              {data.website && <a href={data.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Website</a>}
              {data.twitter && <a href={data.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Twitter</a>}
              {data.instagram && <a href={data.instagram} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Instagram</a>}
            </div>
            <div className="flex gap-2 justify-between">
              <Button variant="outline" onClick={() => { window.location.href = "/settings/profile"; }}>Edit profile</Button>
              <Button onClick={signOut}>Sign out</Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-600">No profile data.</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
