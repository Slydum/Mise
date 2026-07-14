"use client";

import { useEffect, useState } from "react";
import {
  loadPantryOverrides,
  loadPreferredSmBranch,
  loadWeeklyGroceryBudget,
  savePantryOverrides,
  savePreferredSmBranch,
  saveWeeklyGroceryBudget,
} from "@/lib/data/local-store";

/** Client-hydrated preferred SM branch, weekly grocery budget, and per-ingredient pantry status. */
export function useShoppingPreferences() {
  const [preferredSmBranch, setPreferredSmBranchState] = useState<string | null>(null);
  const [weeklyGroceryBudget, setWeeklyGroceryBudgetState] = useState<number | null>(null);
  const [pantryOverrides, setPantryOverridesState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setPreferredSmBranchState(loadPreferredSmBranch());
    setWeeklyGroceryBudgetState(loadWeeklyGroceryBudget());
    setPantryOverridesState(loadPantryOverrides());
  }, []);

  const setPreferredSmBranch = (value: string | null) => {
    setPreferredSmBranchState(value);
    savePreferredSmBranch(value);
  };

  const setWeeklyGroceryBudget = (value: number | null) => {
    setWeeklyGroceryBudgetState(value);
    saveWeeklyGroceryBudget(value);
  };

  /** `undefined` clears back to the algorithmic default. */
  const setPantryOverride = (key: string, value: boolean | undefined) => {
    setPantryOverridesState((prev) => {
      const next = { ...prev };
      if (value === undefined) delete next[key];
      else next[key] = value;
      savePantryOverrides(next);
      return next;
    });
  };

  return {
    preferredSmBranch,
    weeklyGroceryBudget,
    pantryOverrides,
    setPreferredSmBranch,
    setWeeklyGroceryBudget,
    setPantryOverride,
  };
}
