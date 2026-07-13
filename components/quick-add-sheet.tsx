"use client";

import { useState } from "react";
import { Clock, Flame } from "lucide-react";
import { FoodCover } from "@/components/food-cover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { getRecipes } from "@/lib/data";
import { useData } from "@/lib/hooks/use-data";
import type { MealType, Recipe } from "@/lib/types";
import { MEAL_TYPES, MEAL_TYPE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

interface QuickAddSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Preselects a slot when opened from the Plan screen. */
  initialMealType?: MealType;
  onAdd: (mealType: MealType, recipe: Recipe) => void;
}

/** Bottom sheet for quick-adding a recipe to a meal slot. */
export function QuickAddSheet({ open, onOpenChange, initialMealType, onAdd }: QuickAddSheetProps) {
  const recipes = useData(getRecipes);
  const [mealType, setMealType] = useState<MealType>(initialMealType ?? "snack");

  // Re-sync the preselected slot each time the sheet opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open && initialMealType) setMealType(initialMealType);
  }

  const suggestions = recipes
    ? [...recipes].sort(
        (a, b) => Number(b.mealTypes.includes(mealType)) - Number(a.mealTypes.includes(mealType)),
      )
    : [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle>Add a meal</SheetTitle>
        <SheetDescription>Pick a slot, then choose a recipe.</SheetDescription>

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

        <ul className="flex-1 overflow-y-auto px-4 pb-4">
          {suggestions.map((recipe) => (
            <li key={recipe.id}>
              <button
                type="button"
                onClick={() => {
                  onAdd(mealType, recipe);
                  onOpenChange(false);
                }}
                className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-muted"
              >
                <FoodCover
                  recipe={recipe}
                  aspect="square"
                  rounded="rounded-2xl"
                  emojiClassName="text-xl"
                  className="size-12 shrink-0"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-serif text-lg">{recipe.title}</span>
                  <span className="mt-0.5 flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" aria-hidden />
                      {recipe.prepMinutes + recipe.cookMinutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="size-3.5" aria-hidden />
                      {recipe.nutrition.calories} cal
                    </span>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
