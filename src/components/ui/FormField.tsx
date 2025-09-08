"use client";

import { ReactNode } from "react";

export function FormField({ id, label, error, children, hint }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }) {
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm text-gray-700">{label}</label>
      <div aria-describedby={describedBy}>{children}</div>
      {hint && <p id={`${id}-hint`} className="text-xs text-gray-500">{hint}</p>}
      {error && <p id={`${id}-error`} className="text-xs text-red-600">{error}</p>}
    </div>
  );
}


