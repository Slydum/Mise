"use client";

import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SheetTitle } from "@/components/ui/sheet";
import { DaySelector } from "@/components/plan/day-selector";
import { MealTypeEyebrow } from "@/components/meal-type-eyebrow";
import { resolveDayMeals, type ResolvedMeal } from "@/lib/data/plan-overrides";
import { addDays, fromDateKey, toDateKey, todayKey } from "@/lib/dates";
import type { DietaryStyle, MealType } from "@/lib/types";
import { MEAL_TYPES } from "@/lib/types";

interface DaySlotPickerProps {
  title: string;
  dietaryStyle: DietaryStyle;
  onPick: (toDate: string, toMealType: MealType, replaceExisting: boolean) => void;
  /** Shown as a back chevron next to the title; omit for a standalone sheet. */
  onBack?: () => void;
  /** Disables and relabels a slot that represents "this meal's current spot" (copy/move). */
  excludeDate?: string;
  excludeMealType?: MealType;
}

const WINDOW_DAYS = 7;

/** Shared 7-day + meal-slot picker for copy/move (meal-action-sheet) and "Add to plan" (recipe detail). */
export function DaySlotPicker({
  title,
  dietaryStyle,
  onPick,
  onBack,
  excludeDate,
  excludeMealType,
}: DaySlotPickerProps) {
  const [dateKeys] = useState(() => {
    const start = fromDateKey(todayKey());
    return Array.from({ length: WINDOW_DAYS }, (_, i) => toDateKey(addDays(start, i)));
  });
  const [destDate, setDestDate] = useState(dateKeys[0]);
  const [destMeals, setDestMeals] = useState<ResolvedMeal[] | null>(null);

  useEffect(() => {
    let active = true;
    setDestMeals(null);
    resolveDayMeals(destDate, dietaryStyle).then((resolved) => {
      if (active) setDestMeals(resolved);
    });
    return () => {
      active = false;
    };
  }, [destDate, dietaryStyle]);

  return (
    <div className="flex flex-col pb-6">
      <div className="flex items-center gap-1 px-4 pt-2">
        {onBack ? (
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back">
            <ChevronLeft className="size-5" aria-hidden />
          </Button>
        ) : null}
        <SheetTitle className="px-0 pt-0">{title}</SheetTitle>
      </div>

      <DaySelector dateKeys={dateKeys} selected={destDate} onSelect={setDestDate} />

      <div className="flex flex-col gap-2 overflow-y-auto px-5 pt-2">
        {MEAL_TYPES.map((mealType) => {
          const occupant = destMeals?.find((m) => m.mealType === mealType);
          const isExcludedSlot = destDate === excludeDate && mealType === excludeMealType;
          return (
            <div
              key={mealType}
              className="flex items-center gap-2 rounded-2xl border border-border/60 px-4 py-3"
            >
              <button
                type="button"
                disabled={isExcludedSlot}
                onClick={() => onPick(destDate, mealType, false)}
                className="min-w-0 flex-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
              >
                <MealTypeEyebrow mealType={mealType} />
                <span className="block truncate font-serif text-base">
                  {isExcludedSlot
                    ? "This meal's current slot"
                    : occupant
                      ? occupant.recipe.title
                      : "Empty — tap to fill"}
                </span>
              </button>
              {occupant && !isExcludedSlot ? (
                <button
                  type="button"
                  onClick={() => onPick(destDate, mealType, true)}
                  className="shrink-0 text-xs font-medium text-highlight outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Replace
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
