"use client";

interface StepNavProps {
  step: number;
  total?: number;
}

export default function StepNav({ step, total = 3 }: StepNavProps) {
  return (
    <div className="mb-4">
      <div className="h-1.5 w-full bg-black/10 rounded overflow-hidden">
        <div
          className="h-full bg-black/80 transition-[width] duration-500 ease-out"
          style={{ width: `${Math.max(0, Math.min(100, Math.round((step/total)*100)))}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-gray-600">
        {Array.from({ length: total }, (_, i) => i + 1).map((i) => (
          <span key={i} className={`${i === step ? "font-medium text-gray-800" : ""}`}>Step {i}</span>
        ))}
      </div>
    </div>
  );
}


