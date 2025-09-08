import { supabaseServer } from "@/lib/supabase/server";

export default async function AdminOnly({ children }: { children: React.ReactNode }) {
  const supabase = supabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  if (!uid) return null;
  const { data } = await supabase.from('app_admins').select('user_id').eq('user_id', uid).maybeSingle();
  if (!data) return null;
  return <>{children}</>;
}


