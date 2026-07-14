"use client";

import { Minus, Plus, Users } from "lucide-react";

interface ServingsStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

/** Inline +/- control for adjusting servings, driving live-scaled ingredient quantities. */
export function ServingsStepper({ value, onChange, min = 1, max = 24 }: ServingsStepperProps) {
  return (
    <span className="flex items-center gap-1.5">
      <Users className="size-4 shrink-0" aria-hidden />
      <span className="flex items-center gap-0.5 rounded-full bg-muted p-0.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label="Fewer servings"
          className="flex size-6 items-center justify-center rounded-full text-foreground outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring active:bg-card disabled:opacity-30"
        >
          <Minus className="size-3" aria-hidden />
        </button>
        <span className="w-16 text-center text-sm font-medium" aria-live="polite">
          Serves {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label="More servings"
          className="flex size-6 items-center justify-center rounded-full text-foreground outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring active:bg-card disabled:opacity-30"
        >
          <Plus className="size-3" aria-hidden />
        </button>
      </span>
    </span>
  );
}
