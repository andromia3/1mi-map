"use client";

interface StepNavProps {
  step: number;
  total?: number;
  labels?: string[];
  onStepClick?: (step: number) => void;
}

export default function StepNav({ step, total = 3, labels, onStepClick }: StepNavProps) {
  return (
    <div className="mb-4">
      <div className="h-1.5 w-full bg-black/10 rounded overflow-hidden">
        <div
          className="h-full bg-black/80 transition-[width] duration-500 ease-out"
          style={{ width: `${Math.max(0, Math.min(100, Math.round((step/total)*100)))}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-gray-600">
        {Array.from({ length: total }, (_, i) => i + 1).map((i) => {
          const isActive = i === step;
          const label = labels?.[i - 1] ?? `Step ${i}`;
          const Cmp: any = onStepClick ? 'button' : 'span';
          return (
            <Cmp
              key={i}
              className={`${isActive ? "font-medium text-gray-800" : ""} ${onStepClick ? "hover:underline" : ""}`}
              onClick={onStepClick ? () => onStepClick(i) : undefined}
            >
              {label}
            </Cmp>
          );
        })}
      </div>
    </div>
  );
}


