import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import dynamic from "next/dynamic";
const Map1MI = dynamic(() => import("@/components/Map1MI"), { ssr: false });
import MapErrorBoundary from "@/components/MapErrorBoundary";
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
      <MapErrorBoundary>
        <Map1MI user={user} />
      </MapErrorBoundary>
    </>
  );
}
