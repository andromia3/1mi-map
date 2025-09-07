"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { toast } from "@/lib/toast";

const step1Schema = z.object({
  display_name: z.string().trim().min(1, "Display name is required"),
  username: z
    .string()
    .trim()
    .min(3, "Min 3 characters")
    .max(24, "Max 24 characters")
    .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers, underscore only"),
});

const step2Schema = z.object({
  city: z.string().trim().min(1, "City is required"),
  timezone: z.string().trim().min(1, "Timezone is required"),
});

const step3Schema = z.object({
  image_url: z.string().trim().url("Must be a valid URL").optional().or(z.literal("")),
  bio: z.string().max(280, "Max 280 chars").optional(),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  twitter: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type Step1 = z.infer<typeof step1Schema>;
type Step2 = z.infer<typeof step2Schema>;
type Step3 = z.infer<typeof step3Schema>;

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [showSkip, setShowSkip] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  // Step forms
  const form1 = useForm<Step1>({ resolver: zodResolver(step1Schema), defaultValues: { display_name: "", username: "" } });
  const form2 = useForm<Step2>({ resolver: zodResolver(step2Schema), defaultValues: { city: "", timezone: "" } });
  const form3 = useForm<Step3>({ resolver: zodResolver(step3Schema), defaultValues: { image_url: "", bio: "", website: "", twitter: "" } });

  // Prefill timezone
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && !form2.getValues("timezone")) form2.setValue("timezone", tz);
    } catch {}
  }, []);

  // Lowercase username in UI on change/blur
  const usernameRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const sub = form1.watch((v, { name }) => {
      if (name === "username" && v.username) {
        const lower = v.username.toLowerCase();
        if (lower !== v.username) form1.setValue("username", lower, { shouldValidate: true });
      }
    });
    return () => sub.unsubscribe();
  }, [form1]);

  const checkUsernameAvailability = async (valueRaw: string) => {
    const value = (valueRaw || "").trim().toLowerCase();
    if (!value || value.length < 3) { setUsernameStatus("idle"); return; }
    setUsernameStatus("checking");
    try {
      const supabase = supabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username")
        .ilike("username", value);
      if (error) { setUsernameStatus("idle"); return; }
      const takenByOther = (data || []).some((r: any) => r?.id && r.id !== currentUserId);
      setUsernameStatus(takenByOther ? "taken" : "available");
    } catch {
      setUsernameStatus("idle");
      try { toast("Couldn’t check username. Try again."); } catch {}
    }
  };

  // Avatar preview reactively
  useEffect(() => {
    const sub = form3.watch((v, { name }) => {
      if (name === "image_url") setAvatarPreview(v.image_url || "");
    });
    return () => sub.unsubscribe();
  }, [form3]);

  const onKeyDownSubmit = (e: React.KeyboardEvent<HTMLFormElement>, submit: () => void) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Complete your profile</CardTitle>
          <CardDescription>Help members recognise and connect with you.</CardDescription>
          <div className="mt-4">
            <div className="h-1 w-full bg-black/10 rounded">
              <div
                className="h-1 bg-black/80 rounded transition-[width] duration-300"
                style={{ width: `${progress}%` }}
                aria-label={`Progress ${progress}%`}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${(step - 1) * 100}%)` }}
            >
              {/* Step 1 */}
              <div className="w-full shrink-0 pr-2">
                <form
                  onSubmit={form1.handleSubmit(() => setStep(2))}
                  onKeyDown={(e) => onKeyDownSubmit(e, () => form1.handleSubmit(() => setStep(2))())}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="display_name">Display name</Label>
                    <Input id="display_name" {...form1.register("display_name")} autoFocus />
                    {form1.formState.errors.display_name && (
                      <p className="text-sm text-red-600 mt-1">{form1.formState.errors.display_name.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" {...form1.register("username")} ref={usernameRef} placeholder="lowercase, 3–24 chars" onBlur={async () => {
                      const v = (form1.getValues("username") || "").trim().toLowerCase();
                      form1.setValue("username", v, { shouldValidate: true });
                      await checkUsernameAvailability(v);
                    }} />
                    {form1.formState.errors.username && (
                      <p className="text-sm text-red-600 mt-1">{form1.formState.errors.username.message}</p>
                    )}
                    {!form1.formState.errors.username && (
                      <p className="text-xs mt-1">
                        {usernameStatus === "checking" && <span className="text-gray-500">Checking…</span>}
                        {usernameStatus === "available" && <span className="text-green-600">Available</span>}
                        {usernameStatus === "taken" && <span className="text-red-600">Taken</span>}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 justify-between">
                    <Button type="button" variant="ghost" onClick={() => setShowSkip(true)}>Skip for now</Button>
                    <div className="ml-auto flex gap-2">
                      <Button type="submit">Next</Button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Step 2 */}
              <div className="w-full shrink-0 px-1">
                <form
                  onSubmit={form2.handleSubmit(() => setStep(3))}
                  onKeyDown={(e) => onKeyDownSubmit(e, () => form2.handleSubmit(() => setStep(3))())}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" {...form2.register("city")} />
                    {form2.formState.errors.city && (
                      <p className="text-sm text-red-600 mt-1">{form2.formState.errors.city.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input id="timezone" {...form2.register("timezone")} />
                    {form2.formState.errors.timezone && (
                      <p className="text-sm text-red-600 mt-1">{form2.formState.errors.timezone.message}</p>
                    )}
                  </div>
                  <div className="flex gap-2 justify-between">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                    <div className="ml-auto flex gap-2">
                      <Button type="submit">Next</Button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Step 3 */}
              <div className="w-full shrink-0 pl-2">
                <form
                  onSubmit={form3.handleSubmit(() => {/* final submit handled upstream */})}
                  onKeyDown={(e) => onKeyDownSubmit(e, () => form3.handleSubmit(() => {/* */})())}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
                      {avatarPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarPreview} alt="avatar preview" className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="image_url">Avatar URL</Label>
                      <Input id="image_url" placeholder="https://..." {...form3.register("image_url")} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea id="bio" rows={3} {...form3.register("bio")} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input id="website" placeholder="https://example.com" {...form3.register("website")} />
                    </div>
                    <div>
                      <Label htmlFor="twitter">Twitter</Label>
                      <Input id="twitter" placeholder="https://x.com/you" {...form3.register("twitter")} />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-between">
                    <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
                    <div className="ml-auto flex gap-2">
                      <Button type="submit">Save</Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skip modal */}
      <Dialog open={showSkip} onOpenChange={setShowSkip}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skip onboarding?</DialogTitle>
            <DialogDescription>
              Completing your profile helps members recognise you and improves discovery. You can finish this later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSkip(false)}
            >
              Continue editing
            </Button>
            <Button
              onClick={() => {
                try {
                  const ttl = Date.now() + 24 * 60 * 60 * 1000;
                  localStorage.setItem("onboarding:skipUntil", String(ttl));
                } catch {}
                setShowSkip(false);
              }}
            >
              Skip for now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


