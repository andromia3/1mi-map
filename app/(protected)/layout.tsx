import { redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");
  return (
    <div>
      <AppHeader />
      {children}
    </div>
  );
}


