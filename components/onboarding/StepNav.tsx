"use client";

interface StepNavProps {
  step: number;
  total?: number;
}

export default function StepNav({ step, total = 3 }: StepNavProps) {
  return (
    <div className="mb-4 flex items-center gap-2 text-xs text-gray-600">
      {Array.from({ length: total }, (_, i) => i + 1).map((i) => (
        <div key={i} className={`h-1 flex-1 rounded ${i <= step ? "bg-black/80" : "bg-black/10"}`} />
      ))}
    </div>
  );
}


