"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";

const schema = z.object({
  display_name: z.string().min(1, "Required"),
  username: z.string().min(3, "Min 3 chars").max(24, "Max 24 chars").regex(/^[a-z0-9_]+$/, "lowercase letters, numbers, underscore"),
  city: z.string().optional(),
  timezone: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function ProfileSettingsPage() {
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { display_name: "", username: "", city: "", timezone: "" } });

  useEffect(() => {
    (async () => {
      try {
        const supabase = supabaseBrowser();
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) return;
        const { data } = await supabase.from("profiles").select("display_name, username, city, timezone").eq("id", userId).single();
        if (data) form.reset({
          display_name: data.display_name || "",
          username: data.username || "",
          city: (data as any).city || "",
          timezone: (data as any).timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
      } catch {
        toast("Couldn’t load profile");
      }
    })();
  }, []);

  const onSubmit = async (values: FormData) => {
    try {
      const supabase = supabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;
      const payload = { id: userId, ...values } as any;
      await supabase.from("profiles").upsert(payload, { onConflict: "id" } as any);
      toast.success("Profile saved");
    } catch {
      toast.error("Failed to save profile");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <h1 className="text-xl font-semibold">Profile</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="display_name">Display name</Label>
          <Input id="display_name" {...form.register("display_name")} />
          {form.formState.errors.display_name && <p className="text-sm text-red-600 mt-1">{form.formState.errors.display_name.message}</p>}
        </div>
        <div>
          <Label htmlFor="username">Username</Label>
          <Input id="username" {...form.register("username")} placeholder="lowercase, 3–24 chars" />
          {form.formState.errors.username && <p className="text-sm text-red-600 mt-1">{form.formState.errors.username.message}</p>}
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" {...form.register("city")} />
        </div>
        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <Input id="timezone" {...form.register("timezone")} />
        </div>
        <div className="flex gap-2 justify-end">
          <Button type="submit">Save</Button>
        </div>
      </form>
    </div>
  );
}


