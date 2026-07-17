"use client";

import { useEffect, useState } from "react";
import { loadShoppingSettings, saveShoppingSettings } from "@/lib/data/local-store";
import type { ShoppingSettings, ShoppingStore } from "@/lib/types";
import { DEFAULT_SHOPPING_SETTINGS } from "@/lib/types";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Client-hydrated shopping preferences: the user's stores, weekly budget, pricing mode, household size. */
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

  /**
   * Adds (or updates) a store the user shops at — any supermarket, not just
   * SM. storeId is a stable slug of name+city, so re-adding the same store
   * (e.g. re-confirming its address) replaces rather than duplicates. Only
   * becomes the current store if there wasn't one yet (a sensible default
   * for the first store ever added) — adding a second, third, etc. store
   * never silently switches what's currently shown; see setCurrentStore for
   * an explicit switch.
   */
  const addStore = (storeName: string, storeCity: string, storeAddress?: string) => {
    const storeId = slugify(`${storeName}-${storeCity}`);
    const store: ShoppingStore = {
      storeId,
      storeName: storeName.trim(),
      storeCity: storeCity.trim(),
      ...(storeAddress?.trim() ? { storeAddress: storeAddress.trim() } : {}),
      addedAt: new Date().toISOString(),
    };
    setSettingsState((prev) => {
      const stores = [...prev.stores.filter((s) => s.storeId !== storeId), store];
      const next = { ...prev, stores, currentStoreId: prev.currentStoreId ?? storeId };
      saveShoppingSettings(next);
      return next;
    });
    return store;
  };

  /** Switches which store's prices are shown/logged against by default, without changing anything else. */
  const setCurrentStore = (storeId: string) => updateSettings({ currentStoreId: storeId });

  return { settings, updateSettings, addStore, setCurrentStore };
}
