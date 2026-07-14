"use client";

import { useMemo, useState } from "react";
import { BookOpen, Pencil, Recycle, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { SheetActionRow } from "@/components/sheet-action-row";
import { getSuggestedRecipes } from "@/lib/data";
import type { UseDayPlanResult } from "@/lib/hooks/use-day-plan";
import type { DietaryStyle, MealType } from "@/lib/types";
import { MEAL_TYPE_LABELS, MEAL_TYPES } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AddMealSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMealType?: MealType;
  dateKey: string;
  dayPlan: UseDayPlanResult;
  dietaryStyle: DietaryStyle;
  avoidTerms: string[];
  boostTerms: string[];
  onRequestAddRecipe: (mealType: MealType) => void;
  onRequestCustomMeal: (mealType: MealType) => void;
  onRequestLeftovers: (mealType: MealType) => void;
  onToast: (message: string) => void;
}

/** The "+" bottom sheet: Add recipe / Add custom meal / Generate suggestion / Use leftovers. */
export function AddMealSheet({
  open,
  onOpenChange,
  initialMealType,
  dateKey,
  dayPlan,
  dietaryStyle,
  avoidTerms,
  boostTerms,
  onRequestAddRecipe,
  onRequestCustomMeal,
  onRequestLeftovers,
  onToast,
}: AddMealSheetProps) {
  const occupiedTypes = useMemo(() => new Set(dayPlan.meals.map((m) => m.mealType)), [dayPlan.meals]);
  const defaultMealType = useMemo(
    () => MEAL_TYPES.find((t) => !occupiedTypes.has(t)) ?? "snack",
    [occupiedTypes],
  );
  const [mealType, setMealType] = useState<MealType>(initialMealType ?? defaultMealType);

  // Re-sync the preselected/default slot each time the sheet opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setMealType(initialMealType ?? defaultMealType);
  }

  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    const plannedIds = dayPlan.meals.map((m) => m.recipeId);
    const picks = await getSuggestedRecipes(
      plannedIds,
      `${dateKey}:${mealType}`,
      1,
      dietaryStyle,
      avoidTerms,
      boostTerms,
    );
    setGenerating(false);
    const pick = picks[0];
    if (!pick) {
      onToast("No more suggestions match your preferences");
      return;
    }
    dayPlan.addMeal(mealType, pick.id);
    onToast(pick.title);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle>Add a meal</SheetTitle>
        <SheetDescription>Pick a slot, then choose how to fill it.</SheetDescription>

        <div
          role="radiogroup"
          aria-label="Meal slot"
          className="flex gap-2 overflow-x-auto px-6 py-4 no-scrollbar"
        >
          {MEAL_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={mealType === type}
              onClick={() => setMealType(type)}
              className={cn(
                "h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                mealType === type
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {MEAL_TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        <div className="flex flex-col px-2 pb-6">
          <SheetActionRow
            icon={BookOpen}
            label="Add recipe"
            hint="Browse your cookbook"
            showChevron
            onClick={() => {
              onOpenChange(false);
              onRequestAddRecipe(mealType);
            }}
          />
          <SheetActionRow
            icon={Pencil}
            label="Add custom meal"
            hint="Just a name, no recipe"
            showChevron
            onClick={() => {
              onOpenChange(false);
              onRequestCustomMeal(mealType);
            }}
          />
          <SheetActionRow
            icon={Sparkles}
            label="Generate suggestion"
            hint={generating ? "Picking…" : "One tap, we choose"}
            onClick={handleGenerate}
            disabled={generating}
          />
          <SheetActionRow
            icon={Recycle}
            label="Use leftovers"
            hint="From a recent meal"
            showChevron
            onClick={() => {
              onOpenChange(false);
              onRequestLeftovers(mealType);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
