import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Nutrition } from "@/lib/types";

interface NutritionSummaryProps {
  consumed: Nutrition;
  goals: Nutrition;
}

const MACROS = [
  { key: "protein", label: "Protein" },
  { key: "carbs", label: "Carbs" },
  { key: "fat", label: "Fat" },
] as const;

/** Daily calories + macro progress toward the user's goals. */
export function NutritionSummary({ consumed, goals }: NutritionSummaryProps) {
  const caloriePct = Math.min(100, Math.round((consumed.calories / goals.calories) * 100));
  const remaining = Math.max(0, goals.calories - consumed.calories);

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Calories</p>
            <p className="text-3xl font-bold tracking-tight">
              {consumed.calories.toLocaleString()}
              <span className="text-base font-medium text-muted-foreground">
                {" "}/ {goals.calories.toLocaleString()}
              </span>
            </p>
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {remaining.toLocaleString()} left
          </p>
        </div>

        <Progress
          value={caloriePct}
          aria-label={`${caloriePct}% of daily calorie goal`}
          className="h-3"
        />

        <div className="grid grid-cols-3 gap-4" role="list" aria-label="Macronutrients">
          {MACROS.map(({ key, label }) => {
            const pct = Math.min(100, Math.round((consumed[key] / goals[key]) * 100));
            return (
              <div key={key} role="listitem" className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{label}</span>
                  <span className="text-xs font-semibold">
                    {consumed[key]}
                    <span className="font-normal text-muted-foreground">/{goals[key]}g</span>
                  </span>
                </div>
                <Progress value={pct} aria-label={`${label}: ${pct}% of goal`} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
