"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import ProfileSheet from "./ProfileSheet";

export default function AppHeader() {
  const [open, setOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const supabase = supabaseBrowser();
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) return;
        const { data } = await supabase.from("profiles").select("image_url").eq("id", userId).maybeSingle();
        setAvatarUrl((data as any)?.image_url || null);
      } catch {}
    })();
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-end p-3 pointer-events-none">
      <button className="pointer-events-auto w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center" onClick={() => setOpen(true)}>
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="me" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-gray-700">Me</span>
        )}
      </button>
      <ProfileSheet open={open} onOpenChange={setOpen} />
    </div>
  );
}


