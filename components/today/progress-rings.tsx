"use client";

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
    <section aria-label="Today's progress" className="flex justify-center gap-6 px-5">
      <ProgressRing
        value={calories}
        max={caloriesGoal}
        color="var(--color-primary)"
        label="Calories"
        valueText={Math.round(calories).toLocaleString()}
        goalText={`/ ${caloriesGoal.toLocaleString()} kcal`}
      />
      <ProgressRing
        value={protein}
        max={proteinGoal}
        color="var(--color-highlight)"
        label="Protein"
        valueText={`${Math.round(protein)}`}
        goalText={`/ ${proteinGoal} g`}
      />
      <ProgressRing
        value={waterMl}
        max={waterGoalMl}
        color="var(--color-water)"
        label="Water"
        valueText={(waterMl / 1000).toFixed(1)}
        goalText={`/ ${(waterGoalMl / 1000).toFixed(1)} L`}
        onClick={onAddWater}
        addLabel="Add"
      />
    </section>
  );
}
