"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const supabase = supabaseBrowser();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }
    // If auto-confirm is on, you may be signed in immediately; otherwise prompt user
    if (data.session) {
      router.replace("/onboarding");
      router.refresh();
    } else {
      setIsLoading(false);
      alert("Check your email to confirm your account, then sign in.");
      router.replace("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">Join the 1MI Members' Club</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Choose a password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} required />
            </div>
            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}
            <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Signing up..." : "Sign Up"}</Button>
            <div className="text-sm text-center text-gray-600">Already have an account? <a href="/login" className="text-blue-600 underline">Sign in</a></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


