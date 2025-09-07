import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import MapView from "@/components/MapView";
import Topbar from "@/components/Topbar";

export default async function MapPage() {
  const supabase = supabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <Topbar displayName={session.user.user_metadata?.display_name || session.user.email || null} />
      <MapView user={session.user} />
    </>
  );
}
