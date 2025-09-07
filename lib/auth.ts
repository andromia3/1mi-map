import { supabaseServer } from "./supabase/server";

export async function getCurrentUser() {
  const supabase = supabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

 