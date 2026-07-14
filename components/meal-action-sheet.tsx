"use client";

import { useState } from "react";
import { ArrowRightLeft, Copy, Repeat, Trash2, UtensilsCrossed } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { DaySlotPicker } from "@/components/day-slot-picker";
import { SheetActionRow } from "@/components/sheet-action-row";
import type { ResolvedMeal } from "@/lib/data/plan-overrides";
import { addDays, formatShortDate, fromDateKey, toDateKey, todayKey } from "@/lib/dates";
import type { UseDayPlanResult } from "@/lib/hooks/use-day-plan";
import type { DietaryStyle } from "@/lib/types";
import { MEAL_TYPE_LABELS } from "@/lib/types";

interface MealActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meal: ResolvedMeal | null;
  dayPlan: UseDayPlanResult;
  dietaryStyle: DietaryStyle;
  /** Sheet closes itself, then hands off to the parent to open QuickAddSheet in replace mode. */
  onRequestReplace: (meal: ResolvedMeal) => void;
  onToast: (message: string) => void;
}

type View = "menu" | { mode: "copy" | "move" };

function relativeDayLabel(dateKey: string): string {
  const todayK = todayKey();
  if (dateKey === todayK) return "Today";
  if (dateKey === toDateKey(addDays(fromDateKey(todayK), 1))) return "Tomorrow";
  return formatShortDate(fromDateKey(dateKey));
}

/** Replace / copy / move / save-as-leftovers / remove for a single planned meal. */
export function MealActionSheet({
  open,
  onOpenChange,
  meal,
  dayPlan,
  dietaryStyle,
  onRequestReplace,
  onToast,
}: MealActionSheetProps) {
  const [view, setView] = useState<View>("menu");

  // Reset to the menu each time the sheet (re)opens for a (possibly new) meal.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setView("menu");
  }

  if (!meal) return null;

  const canSaveLeftover = meal.mealType === "dinner" && meal.completed;

  const handleRemove = () => {
    dayPlan.removeMeal(meal);
    onToast("Removed");
    onOpenChange(false);
  };

  const handleSaveLeftover = async () => {
    const { placedDirectly } = await dayPlan.markLeftover(meal);
    onToast(
      placedDirectly
        ? "Saved as tomorrow's lunch"
        : "Saved as leftovers — use it anytime from + → Use leftovers",
    );
    onOpenChange(false);
  };

  const handleReplace = () => {
    onOpenChange(false);
    onRequestReplace(meal);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        {view === "menu" ? (
          <div className="flex flex-col pb-6">
            <SheetTitle>{meal.recipe.title}</SheetTitle>
            <SheetDescription>
              {MEAL_TYPE_LABELS[meal.mealType]} · {relativeDayLabel(meal.date)}
            </SheetDescription>
            <div className="mt-3 flex flex-col px-2">
              <SheetActionRow icon={Repeat} label="Replace" onClick={handleReplace} />
              <SheetActionRow
                icon={Copy}
                label="Copy to another day"
                onClick={() => setView({ mode: "copy" })}
                showChevron
              />
              <SheetActionRow
                icon={ArrowRightLeft}
                label="Move to another day"
                onClick={() => setView({ mode: "move" })}
                showChevron
              />
              {canSaveLeftover ? (
                <SheetActionRow
                  icon={UtensilsCrossed}
                  label="Save as tomorrow's lunch"
                  onClick={handleSaveLeftover}
                />
              ) : null}
              <SheetActionRow icon={Trash2} label="Remove" onClick={handleRemove} destructive />
            </div>
          </div>
        ) : (
          <DaySlotPicker
            title={view.mode === "copy" ? "Copy to another day" : "Move to another day"}
            dietaryStyle={dietaryStyle}
            excludeDate={meal.date}
            excludeMealType={meal.mealType}
            onBack={() => setView("menu")}
            onPick={async (toDate, toMealType, replaceExisting) => {
              const mode = view.mode;
              if (mode === "copy") {
                await dayPlan.copyMealTo(meal, toDate, toMealType, { replaceExisting });
                onToast(`Copied to ${relativeDayLabel(toDate)}`);
              } else {
                await dayPlan.moveMealTo(meal, toDate, toMealType, { replaceExisting });
                onToast(`Moved to ${relativeDayLabel(toDate)}`);
              }
              onOpenChange(false);
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
