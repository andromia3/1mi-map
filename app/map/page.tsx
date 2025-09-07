import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import MapView from "@/components/MapView";
import Topbar from "@/components/Topbar";

export default async function MapPage() {
  const supabase = supabaseServer();
  // Prefer getUser() which verifies authenticity with Supabase
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  return (
    <>
      <Topbar displayName={user.user_metadata?.display_name || user.email || null} />
      <MapView user={user} />
    </>
  );
}
