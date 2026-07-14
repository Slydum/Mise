"use client";

import { useState } from "react";
import { AddMealSheet } from "@/components/plan/add-meal-sheet";
import { CustomMealSheet } from "@/components/custom-meal-sheet";
import { DayActionsSheet } from "@/components/plan/day-actions-sheet";
import { LeftoversSheet } from "@/components/leftovers-sheet";
import { MealActionSheet } from "@/components/meal-action-sheet";
import { QuickAddSheet } from "@/components/quick-add-sheet";
import { Toast } from "@/components/ui/toast";
import { createCustomMealRecipe, placeLeftover, type ResolvedMeal } from "@/lib/data/plan-overrides";
import { useToast } from "@/lib/hooks/use-toast";
import type { UseDayPlanResult } from "@/lib/hooks/use-day-plan";
import type { DietaryStyle, LeftoverEntry, MealType, Recipe } from "@/lib/types";

interface UsePlanSheetsOptions {
  dateKey: string | null;
  dayPlan: UseDayPlanResult;
  dietaryStyle: DietaryStyle;
  avoidTerms: string[];
  boostTerms: string[];
}

/**
 * Bundles the FAB (add-meal), meal-action, and day-action sheets shared
 * identically by Today and Plan, so both screens wire the same six sheets
 * through one hook instead of duplicating the state and handlers.
 */
export function usePlanSheets({ dateKey, dayPlan, dietaryStyle, avoidTerms, boostTerms }: UsePlanSheetsOptions) {
  const { message: toastMessage, showToast } = useToast();

  const [addMealSheet, setAddMealSheet] = useState<{ open: boolean; mealType?: MealType }>({
    open: false,
  });
  const [quickAdd, setQuickAdd] = useState<{
    open: boolean;
    mealType?: MealType;
    mode: "add" | "replace";
    replaceTarget?: ResolvedMeal;
  }>({ open: false, mode: "add" });
  const [customMeal, setCustomMeal] = useState<{ open: boolean; mealType: MealType | null }>({
    open: false,
    mealType: null,
  });
  const [leftoversSheet, setLeftoversSheet] = useState<{ open: boolean; mealType: MealType | null }>({
    open: false,
    mealType: null,
  });
  const [mealActions, setMealActions] = useState<{ open: boolean; meal: ResolvedMeal | null }>({
    open: false,
    meal: null,
  });
  const [dayActionsOpen, setDayActionsOpen] = useState(false);

  const handleQuickAddPick = (mealType: MealType, recipe: Recipe) => {
    if (quickAdd.mode === "replace" && quickAdd.replaceTarget) {
      dayPlan.replaceMeal(quickAdd.replaceTarget, recipe.id);
      showToast(`Replaced with ${recipe.title}`);
    } else {
      dayPlan.addMeal(mealType, recipe.id);
      showToast(recipe.title);
    }
  };

  const handleCustomMealSubmit = (name: string) => {
    if (!customMeal.mealType) return;
    const recipe = createCustomMealRecipe(name);
    dayPlan.addMeal(customMeal.mealType, recipe.id);
    showToast(`Added ${name}`);
  };

  const handleLeftoverPick = (entry: LeftoverEntry) => {
    if (!leftoversSheet.mealType || !dateKey) return;
    placeLeftover(entry, dateKey, leftoversSheet.mealType);
    dayPlan.refresh();
    showToast("Added from leftovers");
    setLeftoversSheet({ open: false, mealType: null });
  };

  const openAddSlot = (mealType: MealType) => setAddMealSheet({ open: true, mealType });
  const openQuickAdd = () => setAddMealSheet({ open: true });
  const openMealActions = (meal: ResolvedMeal) => setMealActions({ open: true, meal });
  const openDayActions = () => setDayActionsOpen(true);

  const sheets = dateKey ? (
    <>
      <AddMealSheet
        open={addMealSheet.open}
        onOpenChange={(open) => setAddMealSheet((prev) => ({ ...prev, open }))}
        initialMealType={addMealSheet.mealType}
        dateKey={dateKey}
        dayPlan={dayPlan}
        dietaryStyle={dietaryStyle}
        avoidTerms={avoidTerms}
        boostTerms={boostTerms}
        onRequestAddRecipe={(mealType) => setQuickAdd({ open: true, mealType, mode: "add" })}
        onRequestCustomMeal={(mealType) => setCustomMeal({ open: true, mealType })}
        onRequestLeftovers={(mealType) => setLeftoversSheet({ open: true, mealType })}
        onToast={showToast}
      />

      <QuickAddSheet
        open={quickAdd.open}
        onOpenChange={(open) => setQuickAdd((prev) => ({ ...prev, open }))}
        initialMealType={quickAdd.mealType}
        mode={quickAdd.mode}
        onAdd={handleQuickAddPick}
      />

      <CustomMealSheet
        open={customMeal.open}
        onOpenChange={(open) => setCustomMeal((prev) => ({ ...prev, open }))}
        mealType={customMeal.mealType}
        onSubmit={handleCustomMealSubmit}
      />

      <LeftoversSheet
        open={leftoversSheet.open}
        onOpenChange={(open) => setLeftoversSheet((prev) => ({ ...prev, open }))}
        mealType={leftoversSheet.mealType}
        onPick={handleLeftoverPick}
      />

      <MealActionSheet
        open={mealActions.open}
        onOpenChange={(open) => setMealActions((prev) => ({ ...prev, open }))}
        meal={mealActions.meal}
        dayPlan={dayPlan}
        dietaryStyle={dietaryStyle}
        onRequestReplace={(meal) =>
          setQuickAdd({ open: true, mealType: meal.mealType, mode: "replace", replaceTarget: meal })
        }
        onToast={showToast}
      />

      <DayActionsSheet
        open={dayActionsOpen}
        onOpenChange={setDayActionsOpen}
        onClearDay={() => {
          dayPlan.clearDay();
          showToast("Day cleared");
        }}
        onRegenerateDay={async () => {
          await dayPlan.regenerateDay(avoidTerms, boostTerms);
          showToast("Day regenerated");
        }}
      />
    </>
  ) : null;

  return {
    openAddSlot,
    openQuickAdd,
    openMealActions,
    openDayActions,
    sheets,
    toast: <Toast message={toastMessage} />,
  };
}
