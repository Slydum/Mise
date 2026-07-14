"use client";

import { useEffect, useState } from "react";
import { loadShoppingSettings, saveShoppingSettings } from "@/lib/data/local-store";
import type { ShoppingSettings, SmStore } from "@/lib/types";
import { DEFAULT_SHOPPING_SETTINGS } from "@/lib/types";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Client-hydrated shopping preferences: exact SM store, weekly budget, pricing mode, household size. */
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

  /** Sets (or changes) the exact SM store — required before any pricing is shown. Generates a stable storeId from name+city so purchase history can be scoped to it. */
  const setStore = (storeName: string, storeCity: string, storeAddress?: string) => {
    const store: SmStore = {
      storeId: slugify(`${storeName}-${storeCity}`),
      storeName: storeName.trim(),
      storeCity: storeCity.trim(),
      ...(storeAddress?.trim() ? { storeAddress: storeAddress.trim() } : {}),
      selectedAt: new Date().toISOString(),
    };
    updateSettings({ store });
    return store;
  };

  return { settings, updateSettings, setStore };
}
