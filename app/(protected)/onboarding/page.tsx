"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import OnboardingForm from "@/components/onboarding/OnboardingForm";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Complete your profile</CardTitle>
          <CardDescription>Help members recognise and connect with you.</CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm />
        </CardContent>
      </Card>
    </div>
  );
}


