"use client";

import { useMemo, useState } from "react";
import { Clock, Flame } from "lucide-react";
import { FoodCover } from "@/components/food-cover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { filterRecipesByDiet, recipeContainsAnyIngredient } from "@/lib/diet";
import { getRecipes } from "@/lib/data";
import { useData } from "@/lib/hooks/use-data";
import { useDietaryStyle } from "@/lib/hooks/use-dietary-style";
import { useFoodPreferences } from "@/lib/hooks/use-food-preferences";
import type { MealType, Recipe } from "@/lib/types";
import { MEAL_TYPES, MEAL_TYPE_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

interface QuickAddSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Preselects a slot when opened from the Plan screen. */
  initialMealType?: MealType;
  /** "replace" swaps only the title/description text — the callback contract is unchanged. */
  mode?: "add" | "replace";
  onAdd: (mealType: MealType, recipe: Recipe) => void;
}

/** Bottom sheet for quick-adding (or replacing) a recipe in a meal slot. Only suggests recipes matching the user's food preferences. */
export function QuickAddSheet({
  open,
  onOpenChange,
  initialMealType,
  mode = "add",
  onAdd,
}: QuickAddSheetProps) {
  const recipes = useData(getRecipes);
  const { dietaryStyle } = useDietaryStyle();
  const { allergies, excludedIngredients } = useFoodPreferences();
  const [mealType, setMealType] = useState<MealType>(initialMealType ?? "snack");

  // Re-sync the preselected slot each time the sheet opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open && initialMealType) setMealType(initialMealType);
  }

  const avoidTerms = useMemo(
    () => [...allergies, ...excludedIngredients],
    [allergies, excludedIngredients],
  );

  const suggestions = useMemo(() => {
    if (!recipes) return [];
    const compatible = filterRecipesByDiet(recipes, dietaryStyle).filter(
      (r) => !recipeContainsAnyIngredient(r, avoidTerms),
    );
    return [...compatible].sort(
      (a, b) => Number(b.mealTypes.includes(mealType)) - Number(a.mealTypes.includes(mealType)),
    );
  }, [recipes, dietaryStyle, avoidTerms, mealType]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle>{mode === "replace" ? "Replace this meal" : "Add a meal"}</SheetTitle>
        <SheetDescription>
          {mode === "replace" ? "Choose a new recipe for this slot." : "Pick a slot, then choose a recipe."}
        </SheetDescription>

        {mode === "add" ? (
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
        ) : (
          <div className="h-4" aria-hidden />
        )}

        {suggestions.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">
            No recipes match your food preferences yet. Adjust them in Profile to see more.
          </p>
        ) : (
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
                    <span className="block line-clamp-2 font-serif text-lg leading-snug">
                      {recipe.title}
                    </span>
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
        )}
      </SheetContent>
    </Sheet>
  );
}
