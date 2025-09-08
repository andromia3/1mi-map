"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/map";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const supabase = supabaseBrowser();
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setIsLoading(false); return; }
      router.replace(redirect); router.refresh();
      setTimeout(() => setIsLoading(false), 400);
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) { setError(error.message); setIsLoading(false); return; }
      if (data.session) { router.replace("/onboarding"); router.refresh(); }
      else { setIsLoading(false); alert("Check your email to confirm, then sign in."); router.replace("/login"); }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{mode === 'login' ? 'Sign in' : 'Create an account'}</CardTitle>
          <CardDescription className="text-center">1MI Members&apos; Club</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
            </div>
            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
            <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? (mode==='login'?'Signing in...':'Signing up...') : (mode==='login'?'Sign In':'Sign Up')}</Button>
            {mode === 'login' ? (
              <div className="text-sm text-center text-gray-600">No account? <a href="/signup" className="text-blue-600 underline">Create one</a></div>
            ) : (
              <div className="text-sm text-center text-gray-600">Have an account? <a href="/login" className="text-blue-600 underline">Sign in</a></div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


