"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TopbarProps {
  displayName: string | null;
}

export default function Topbar({ displayName }: TopbarProps) {
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleLogout = async () => {
    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const onSubmitPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess("Password changed successfully!");
        setNewPassword("");
        setTimeout(() => {
          setIsChangePasswordOpen(false);
          setSuccess("");
        }, 2000);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed top-0 right-0 z-50 p-4">
      <div className="flex items-center space-x-3">
        <span className="text-sm font-medium text-white bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
          {displayName}
        </span>
        
        <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="bg-white/90 hover:bg-white">
              Change Password
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Choose a new password for your account.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmitPasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                  {success}
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsChangePasswordOpen(false);
                    setNewPassword("");
                    setError("");
                    setSuccess("");
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Changing..." : "Change Password"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="bg-white/90 hover:bg-white"
        >
          Logout
        </Button>
      </div>
    </div>
  )
}
