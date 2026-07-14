"use client";

import { useEffect, useState } from "react";
import { loadShoppingSettings, saveShoppingSettings } from "@/lib/data/local-store";
import type { ShoppingSettings } from "@/lib/types";
import { DEFAULT_SHOPPING_SETTINGS } from "@/lib/types";

/** Client-hydrated shopping preferences: supermarket, branch, weekly budget, pricing mode, household size. */
export function useShoppingSettings() {
  const [settings, setSettingsState] = useState<ShoppingSettings>(DEFAULT_SHOPPING_SETTINGS);

  useEffect(() => {
    setSettingsState(loadShoppingSettings());
  }, []);

  const updateSettings = (patch: Partial<ShoppingSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      saveShoppingSettings(next);
      return next;
    });
  };

  return { settings, updateSettings };
}
