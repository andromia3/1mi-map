"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StepNav from "./StepNav";
import { profilePartialSchema, usernameSchema } from "@/lib/validation/profile";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { toast } from "@/lib/toast";

const step1Schema = z.object({ display_name: z.string().min(1, "Required"), username: usernameSchema });
const step2Schema = z.object({ city: z.string().min(1, "Required"), timezone: z.string().min(1, "Required") });
type Step1 = z.infer<typeof step1Schema>;
type Step2 = z.infer<typeof step2Schema>;
const step3Schema = z.object({
  image_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  bio: z.string().max(280, "Max 280 chars").optional().or(z.literal("")),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  twitter: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  instagram: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});
type Step3 = z.infer<typeof step3Schema>;

export default function OnboardingForm() {
  const [step, setStep] = useState(1);
  const [checking, setChecking] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [tzList, setTzList] = useState<string[]>([]);
  const debounceRef = useRef<number | null>(null);
  const usernameRef = useRef<HTMLInputElement | null>(null);

  const form1 = useForm<Step1>({ resolver: zodResolver(step1Schema), defaultValues: { display_name: "", username: "" } });
  const form2 = useForm<Step2>({ resolver: zodResolver(step2Schema), defaultValues: { city: "", timezone: "" } });
  const form3 = useForm<Step3>({ resolver: zodResolver(step3Schema), defaultValues: { image_url: "", bio: "", website: "", twitter: "", instagram: "" } });

  // Provision/fetch profile row on mount
  useEffect(() => {
    (async () => {
      try {
        const supabase = supabaseBrowser();
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) return;
        const { data: row } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
        if (!row) {
          await supabase.from("profiles").insert({ id: userId } as any);
        } else {
          form1.reset({ display_name: row.display_name || "", username: (row.username || "").toLowerCase() });
          form2.reset({ city: (row as any).city || "", timezone: (row as any).timezone || Intl.DateTimeFormat().resolvedOptions().timeZone });
          form3.reset({ image_url: (row as any).image_url || "", bio: (row as any).bio || "", website: (row as any).website || "", twitter: (row as any).twitter || "", instagram: (row as any).instagram || "" });
        }
      } catch {
        toast("Couldn’t load profile");
      }
    })();
  }, []);

  // Build timezone list once (searchable datalist)
  useEffect(() => {
    try {
      const supported = (Intl as any).supportedValuesOf?.('timeZone') as string[] | undefined;
      if (supported && Array.isArray(supported) && supported.length) setTzList(supported);
      else setTzList(["Europe/London", "Europe/Paris", "America/New_York", "America/Los_Angeles", "Asia/Tokyo", "Australia/Sydney"]);
    } catch {
      setTzList(["Europe/London"]);
    }
  }, []);

  const savePartial = async (partial: Record<string, any>) => {
    try {
      // validate partial keys with zod
      profilePartialSchema.parse(partial);
      const supabase = supabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return false;
      await supabase.from("profiles").upsert({ id: userId, ...partial } as any, { onConflict: "id" } as any);
      return true;
    } catch (e) {
      console.warn("[onboarding] save failed", e);
      toast.error("Save failed");
      return false;
    }
  };

  const scheduleSave = (partial: Record<string, any>) => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      const ok = await savePartial(partial);
      if (ok) toast.success("Saved");
    }, 300) as unknown as number;
  };

  const checkUsername = async (valueRaw: string) => {
    const value = (valueRaw || "").trim().toLowerCase();
    if (!value || value.length < 3) { setChecking("idle"); return; }
    setChecking("checking");
    try {
      const supabase = supabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username")
        .ilike("username", value);
      if (error) { setChecking("idle"); return; }
      const takenByOther = (data || []).some((r: any) => r?.id && r.id !== currentUserId);
      setChecking(takenByOther ? "taken" : "available");
    } catch {
      setChecking("idle");
      toast("Couldn’t check username");
    }
  };

  const onNext1 = async () => {
    const valid = await form1.trigger();
    if (!valid) return;
    const values = form1.getValues();
    const ok = await savePartial({ display_name: values.display_name.trim(), username: values.username.trim().toLowerCase() });
    if (ok) setStep(2);
  };
  const onNext2 = async () => {
    const valid = await form2.trigger();
    if (!valid) return;
    const values = form2.getValues();
    const ok = await savePartial({ city: values.city.trim(), timezone: values.timezone.trim() });
    if (ok) setStep(3);
  };
  const onFinish = async () => {
    const valid = await form3.trigger();
    if (!valid) return;
    const v = form3.getValues();
    const ok = await savePartial({ image_url: (v.image_url || "").trim() || null, bio: (v.bio || "").trim() || null, website: (v.website || "").trim() || null, twitter: (v.twitter || "").trim() || null, instagram: (v.instagram || "").trim() || null });
    if (!ok) return;
    try {
      const supabase = supabaseBrowser();
      const { data } = await supabase.rpc('profile_is_complete');
      if (data === true) {
        window.location.href = "/map";
      } else {
        toast("Profile incomplete; please finish required fields");
      }
    } catch {
      window.location.href = "/map";
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <StepNav step={step} />
      {step === 1 && (
        <form onSubmit={(e) => { e.preventDefault(); onNext1(); }} className="space-y-4">
          <div>
            <Label htmlFor="display_name">Display name</Label>
            <Input id="display_name" {...form1.register("display_name")} autoFocus />
            {form1.formState.errors.display_name && <p className="text-sm text-red-600 mt-1">{form1.formState.errors.display_name.message}</p>}
          </div>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" {...form1.register("username", { onBlur: async () => { const v = form1.getValues("username").trim().toLowerCase(); form1.setValue("username", v, { shouldValidate: true }); scheduleSave({ username: v }); checkUsername(v);} })} ref={usernameRef} placeholder="lowercase, 3–24 chars" />
            {form1.formState.errors.username && <p className="text-sm text-red-600 mt-1">{form1.formState.errors.username.message}</p>}
            {!form1.formState.errors.username && (
              <p className="text-xs mt-1">
                {checking === "checking" && <span className="text-gray-500">Checking…</span>}
                {checking === "available" && <span className="text-green-600">Available</span>}
                {checking === "taken" && <span className="text-red-600">Taken</span>}
              </p>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="submit">Save & Continue</Button>
          </div>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={(e) => { e.preventDefault(); onNext2(); }} className="space-y-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" {...form2.register("city", { onBlur: () => { const v = form2.getValues("city").trim(); form2.setValue("city", v, { shouldValidate: true }); scheduleSave({ city: v }); } })} />
            {form2.formState.errors.city && <p className="text-sm text-red-600 mt-1">{form2.formState.errors.city.message}</p>}
          </div>
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" list="tzlist" {...form2.register("timezone", { onBlur: () => { const v = form2.getValues("timezone").trim(); form2.setValue("timezone", v, { shouldValidate: true }); scheduleSave({ timezone: v }); } })} defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone} />
            <datalist id="tzlist">
              {tzList.map((tz) => (<option key={tz} value={tz} />))}
            </datalist>
            {form2.formState.errors.timezone && <p className="text-sm text-red-600 mt-1">{form2.formState.errors.timezone.message}</p>}
          </div>
          <div className="flex gap-2 justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
            <div className="ml-auto">
              <Button type="submit">Save & Continue</Button>
            </div>
          </div>
        </form>
      )}
      {step === 3 && (
        <form onSubmit={(e) => { e.preventDefault(); onFinish(); }} className="space-y-4">
          <div>
            <Label htmlFor="image_url">Avatar URL</Label>
            <Input id="image_url" placeholder="https://..." {...form3.register("image_url", { onBlur: () => scheduleSave({ image_url: (form3.getValues("image_url") || "").trim() || null }) })} />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" rows={3} {...form3.register("bio", { onBlur: () => scheduleSave({ bio: (form3.getValues("bio") || "").trim() || null }) })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="website">Website</Label>
              <Input id="website" placeholder="https://example.com" {...form3.register("website", { onBlur: () => scheduleSave({ website: (form3.getValues("website") || "").trim() || null }) })} />
            </div>
            <div>
              <Label htmlFor="twitter">Twitter</Label>
              <Input id="twitter" placeholder="https://x.com/you" {...form3.register("twitter", { onBlur: () => scheduleSave({ twitter: (form3.getValues("twitter") || "").trim() || null }) })} />
            </div>
          </div>
          <div className="flex gap-2 justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
            <div className="ml-auto">
              <Button type="submit">Finish</Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}


