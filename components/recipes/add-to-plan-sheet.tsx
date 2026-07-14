"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { DaySlotPicker } from "@/components/day-slot-picker";
import { addMeal } from "@/lib/data/plan-overrides";
import type { DietaryStyle, MealType } from "@/lib/types";

interface AddToPlanSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId: string;
  dietaryStyle: DietaryStyle;
  onAdded: (mealType: MealType, dateKey: string) => void;
}

/** Picks a day + slot to add this recipe into the plan, from the recipe detail page. */
export function AddToPlanSheet({ open, onOpenChange, recipeId, dietaryStyle, onAdded }: AddToPlanSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <DaySlotPicker
          title="Add to plan"
          dietaryStyle={dietaryStyle}
          onPick={(toDate, toMealType) => {
            addMeal(toDate, toMealType, recipeId);
            onOpenChange(false);
            onAdded(toMealType, toDate);
          }}
        />
      </SheetContent>
    </Sheet>
  );
}
