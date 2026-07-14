"use client";

import { useEffect, useState } from "react";
import { FoodCover } from "@/components/food-cover";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { buildRecipeIndex } from "@/lib/data/plan-overrides";
import { formatShortDate, fromDateKey } from "@/lib/dates";
import { useLeftovers } from "@/lib/hooks/use-leftovers";
import type { LeftoverEntry, MealType, Recipe } from "@/lib/types";
import { MEAL_TYPE_LABELS } from "@/lib/types";

interface LeftoversSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealType: MealType | null;
  onPick: (entry: LeftoverEntry) => void;
}

/** Lists unconsumed, unexpired leftovers for the "Use leftovers" FAB option. */
export function LeftoversSheet({ open, onOpenChange, mealType, onPick }: LeftoversSheetProps) {
  const { leftovers, refresh } = useLeftovers();
  const [recipeById, setRecipeById] = useState<Map<string, Recipe> | null>(null);

  useEffect(() => {
    if (!open) return;
    // The sheet mounts once and toggles visibility via `open`, so the list
    // must be re-pulled from localStorage on each open — otherwise a
    // leftover saved after mount (the common case) never appears.
    refresh();
    let active = true;
    buildRecipeIndex().then((map) => {
      if (active) setRecipeById(map);
    });
    return () => {
      active = false;
    };
  }, [open, refresh]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetTitle>Use leftovers</SheetTitle>
        <SheetDescription>
          {mealType
            ? `Fill ${MEAL_TYPE_LABELS[mealType].toLowerCase()} from a recent meal.`
            : "Pick a saved leftover."}
        </SheetDescription>

        {leftovers.length === 0 ? (
          <p className="px-6 pb-6 pt-2 text-sm text-muted-foreground">
            No leftovers saved yet. Mark a completed dinner as &ldquo;Save as tomorrow&apos;s
            lunch&rdquo; to bank one here.
          </p>
        ) : (
          <ul className="flex-1 overflow-y-auto px-4 pb-6 pt-2">
            {leftovers.map((entry) => {
              const recipe = recipeById?.get(entry.recipeId);
              if (!recipe) return null;
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => onPick(entry)}
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
                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        From {MEAL_TYPE_LABELS[entry.sourceMealType].toLowerCase()},{" "}
                        {formatShortDate(fromDateKey(entry.sourceDate))}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}
