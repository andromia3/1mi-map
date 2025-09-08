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
import { profilePartialSchema } from "@/lib/validation/profile";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { toast } from "@/lib/toast";
import { log } from "@/src/lib/log";

const step1Schema = z.object({ display_name: z.string().min(1, "Required"), image_url: z.string().url("Must be a valid URL").optional().or(z.literal("")) });
const step2Schema = z.object({ city: z.string().min(1, "Required"), timezone: z.string().min(1, "Required") });
type Step1 = z.infer<typeof step1Schema>;
type Step2 = z.infer<typeof step2Schema>;
const step3Schema = z.object({
  bio: z.string().max(280, "Max 280 chars").optional().or(z.literal("")),
  linkedin_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  instagram_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  x_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  youtube_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  website_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});
type Step3 = z.infer<typeof step3Schema>;

export default function OnboardingForm() {
  const [step, setStep] = useState(1);
  const [savingStep, setSavingStep] = useState(false);
  const [checking, setChecking] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [tzList, setTzList] = useState<string[]>([]);
  const debounceRef = useRef<number | null>(null);
  const usernameRef = useRef<HTMLInputElement | null>(null);

  const form1 = useForm<Step1>({ resolver: zodResolver(step1Schema), defaultValues: { display_name: "", image_url: "" } });
  const form2 = useForm<Step2>({ resolver: zodResolver(step2Schema), defaultValues: { city: "", timezone: "" } });
  const form3 = useForm<Step3>({ resolver: zodResolver(step3Schema), defaultValues: { bio: "", linkedin_url: "", instagram_url: "", x_url: "", youtube_url: "", website_url: "" } });

  const DRAFT_KEY = 'onboarding:draft';

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
          form1.reset({ display_name: row.display_name || "", image_url: (row as any).image_url || "" });
          form2.reset({ city: (row as any).city || "", timezone: (row as any).timezone || Intl.DateTimeFormat().resolvedOptions().timeZone });
          form3.reset({ bio: (row as any).bio || "", linkedin_url: (row as any).linkedin_url || "", instagram_url: (row as any).instagram_url || "", x_url: (row as any).x_url || "", youtube_url: (row as any).youtube_url || "", website_url: (row as any).website_url || "" });
        }
        // Hydrate draft from localStorage if available (overrides fetched values)
        try {
          const raw = localStorage.getItem(DRAFT_KEY);
          if (raw) {
            const draft = JSON.parse(raw) as any;
            if (draft?.form1) form1.reset(draft.form1);
            if (draft?.form2) form2.reset(draft.form2);
            if (draft?.form3) form3.reset(draft.form3);
            if (typeof draft?.step === 'number' && draft.step >= 1 && draft.step <= 3) setStep(draft.step);
          }
        } catch {}
      } catch {
        toast("Couldn’t load profile");
      }
    })();
  }, []);

  // Autosave draft to localStorage every 500ms
  useEffect(() => {
    const id = window.setInterval(() => {
      try {
        const draft = {
          step,
          form1: form1.getValues(),
          form2: form2.getValues(),
          form3: form3.getValues(),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {}
    }, 500);
    return () => window.clearInterval(id);
  }, [step, form1, form2, form3]);

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
      log.warn("[onboarding] save failed", e);
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

  const checkUsername = async (_valueRaw: string) => { /* removed in no-username mode */ };

  const onNext1 = async () => {
    const valid = await form1.trigger();
    if (!valid) return;
    const values = form1.getValues();
    setSavingStep(true);
    const ok = await savePartial({ display_name: values.display_name.trim(), image_url: (values.image_url || "").trim() || null });
    if (ok) { toast.success("Saved"); setStep(2); } else { toast.error("Save failed"); }
    setSavingStep(false);
  };
  const onNext2 = async () => {
    const valid = await form2.trigger();
    if (!valid) return;
    const values = form2.getValues();
    setSavingStep(true);
    const ok = await savePartial({ city: values.city.trim(), timezone: values.timezone.trim() });
    if (ok) { toast.success("Saved"); setStep(3); } else { toast.error("Save failed"); }
    setSavingStep(false);
  };
  const onFinish = async () => {
    const valid = await form3.trigger();
    if (!valid) return;
    const v = form3.getValues();
    setSavingStep(true);
    // Final save with ALL required fields to avoid read-after-write races
    const f1 = form1.getValues();
    const f2 = form2.getValues();
    const ok = await savePartial({
      display_name: (f1.display_name || "").trim(),
      city: (f2.city || "").trim(),
      timezone: (f2.timezone || "").trim(),
      bio: (v.bio || "").trim() || null,
      linkedin_url: (v.linkedin_url || "").trim() || null,
      instagram_url: (v.instagram_url || "").trim() || null,
      x_url: (v.x_url || "").trim() || null,
      youtube_url: (v.youtube_url || "").trim() || null,
      website_url: (v.website_url || "").trim() || null,
    });
    if (!ok) { toast.error("Save failed"); setSavingStep(false); return; }
    try {
      const supabase = supabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (!uid) { window.location.href = "/login"; return; }
      // Client-side completeness check first to avoid false negatives
      const completeLocal = Boolean((f1.display_name||"").trim() && (f2.city||"").trim() && (f2.timezone||"").trim());
      if (completeLocal) {
        try { localStorage.removeItem(DRAFT_KEY); } catch {}
        toast.success("Profile completed");
        try { document.cookie = "onboarding_ok=1; Max-Age=60; Path=/"; } catch {}
        window.location.href = "/map";
      } else {
        // As a fallback, re-check from DB after a brief delay
        await new Promise((r) => setTimeout(r, 200));
        const { data: p } = await supabase.from("profiles").select("display_name, city, timezone").eq("id", uid).maybeSingle();
        const complete = Boolean(p && String(p.display_name||"").trim() && String(p.city||"").trim() && String(p.timezone||"").trim());
        if (complete) {
          try { localStorage.removeItem(DRAFT_KEY); } catch {}
          toast.success("Profile completed");
          try { document.cookie = "onboarding_ok=1; Max-Age=60; Path=/"; } catch {}
          window.location.href = "/map";
        } else {
          toast("Profile incomplete; please finish required fields");
        }
      }
    } catch {
      window.location.href = "/map";
    }
    setSavingStep(false);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <StepNav step={step} />
      {step === 1 && (
        <form onSubmit={(e) => { e.preventDefault(); onNext1(); }} className="space-y-4 transition-opacity duration-300 ease-out">
          <div className="text-sm text-gray-700 bg-gray-50 border rounded p-3">
            <p className="font-medium">Step 1 of 3 — About you</p>
            <p className="mt-1">Your display name will be shown to members. Add an optional avatar URL.</p>
          </div>
          <div>
            <Label htmlFor="display_name">Display name</Label>
            <Input id="display_name" {...form1.register("display_name")} autoFocus />
            {form1.formState.errors.display_name && <p className="text-sm text-red-600 mt-1">{form1.formState.errors.display_name.message}</p>}
          </div>
          <div>
            <Label htmlFor="image_url">Avatar URL</Label>
            <Input id="image_url" placeholder="https://..." {...form1.register("image_url", { onBlur: () => { const v = (form1.getValues("image_url")||"").trim(); form1.setValue("image_url", v, { shouldValidate: true }); scheduleSave({ image_url: v || null }); } })} />
            {(() => {
              const url = form1.watch("image_url");
              if (!url) return null;
              return (
                <div className="mt-2 w-16 h-16 rounded-full overflow-hidden bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="preview" className="w-full h-full object-cover" />
                </div>
              );
            })()}
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="submit" disabled={savingStep}>{savingStep ? 'Saving…' : 'Save & Continue'}</Button>
          </div>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={(e) => { e.preventDefault(); onNext2(); }} className="space-y-4 transition-opacity duration-300 ease-out">
          <div className="text-sm text-gray-700 bg-gray-50 border rounded p-3">
            <p className="font-medium">Step 2 of 3 — Location & time</p>
            <p className="mt-1">Share your city and preferred timezone for event suggestions.</p>
          </div>
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
              <Button type="submit" disabled={savingStep}>{savingStep ? 'Saving…' : 'Save & Continue'}</Button>
            </div>
          </div>
        </form>
      )}
      {step === 3 && (
        <form onSubmit={(e) => { e.preventDefault(); onFinish(); }} className="space-y-4 transition-opacity duration-300 ease-out">
          <div className="text-sm text-gray-700 bg-gray-50 border rounded p-3">
            <p className="font-medium">Step 3 of 3 — Bio & links</p>
            <p className="mt-1">Optional: add a short bio and links. You can edit these anytime in Settings.</p>
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" rows={3} {...form3.register("bio", { onBlur: () => scheduleSave({ bio: (form3.getValues("bio") || "").trim() || null }) })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="website_url">Website</Label>
              <Input id="website_url" placeholder="https://example.com" {...form3.register("website_url", { onBlur: () => scheduleSave({ website_url: (form3.getValues("website_url") || "").trim() || null }) })} />
            </div>
            <div>
              <Label htmlFor="x_url">X (Twitter)</Label>
              <Input id="x_url" placeholder="https://x.com/you" {...form3.register("x_url", { onBlur: () => scheduleSave({ x_url: (form3.getValues("x_url") || "").trim() || null }) })} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="linkedin_url">LinkedIn</Label>
              <Input id="linkedin_url" placeholder="https://linkedin.com/in/you" {...form3.register("linkedin_url", { onBlur: () => scheduleSave({ linkedin_url: (form3.getValues("linkedin_url") || "").trim() || null }) })} />
            </div>
            <div>
              <Label htmlFor="instagram_url">Instagram</Label>
              <Input id="instagram_url" placeholder="https://instagram.com/you" {...form3.register("instagram_url", { onBlur: () => scheduleSave({ instagram_url: (form3.getValues("instagram_url") || "").trim() || null }) })} />
            </div>
          </div>
          <div>
            <Label htmlFor="youtube_url">YouTube</Label>
            <Input id="youtube_url" placeholder="https://youtube.com/@you" {...form3.register("youtube_url", { onBlur: () => scheduleSave({ youtube_url: (form3.getValues("youtube_url") || "").trim() || null }) })} />
          </div>
          <div className="flex gap-2 justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
            <div className="ml-auto">
              <Button type="submit" disabled={savingStep}>{savingStep ? 'Saving…' : 'Finish'}</Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}



