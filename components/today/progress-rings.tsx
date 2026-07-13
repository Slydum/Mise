"use client";

import { Plus } from "lucide-react";
import { ProgressRing } from "@/components/ui/progress-ring";

interface ProgressRingsProps {
  calories: number;
  caloriesGoal: number;
  protein: number;
  proteinGoal: number;
  waterMl: number;
  waterGoalMl: number;
  onAddWater: () => void;
}

/** Calm, bare row of Apple-Health-style rings for the day's headline metrics. */
export function ProgressRings({
  calories,
  caloriesGoal,
  protein,
  proteinGoal,
  waterMl,
  waterGoalMl,
  onAddWater,
}: ProgressRingsProps) {
  return (
    <section aria-label="Today's progress" className="flex justify-center gap-7 px-5 py-2">
      <ProgressRing
        value={calories}
        max={caloriesGoal}
        color="var(--color-primary)"
        label="Calories"
        centerText={`${Math.round(calories)}`}
      />
      <ProgressRing
        value={protein}
        max={proteinGoal}
        color="var(--color-highlight)"
        label="Protein"
        centerText={`${Math.round(protein)}g`}
      />
      <div className="relative">
        <ProgressRing
          value={waterMl}
          max={waterGoalMl}
          color="var(--color-water)"
          label="Water"
          centerText={`${(waterMl / 1000).toFixed(1)}L`}
          onClick={onAddWater}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-water text-white"
          style={{ backgroundColor: "var(--color-water)" }}
        >
          <Plus className="size-3" strokeWidth={3} />
        </span>
      </div>
    </section>
  );
}
