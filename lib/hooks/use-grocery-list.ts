"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { generateGroceryItems } from "@/lib/data/grocery-generator";
import { filterOutPantryItems } from "@/lib/grocery/aggregate";
import { getCanonicalKey } from "@/lib/grocery/ingredient-catalog";
import { overrideId, type PriceOverride } from "@/lib/grocery/price-overrides";
import {
  addGroceryItems,
  addPantryItem,
  loadCheckedItems,
  loadExtraGroceryItems,
  loadPantryItems,
  removeExtraGroceryItem,
  removePantryItem,
  saveCheckedItems,
  savePriceOverride,
  updateExtraGroceryItem,
} from "@/lib/data/local-store";
import type { DietaryStyle, GroceryItem } from "@/lib/types";

export interface UseGroceryListResult {
  items: GroceryItem[];
  loading: boolean;
  checked: Record<string, boolean>;
  pantryItems: string[];
  toggleChecked: (id: string) => void;
  clearChecked: () => void;
  addItem: (item: Omit<GroceryItem, "id">) => void;
  updateItem: (id: string, patch: Partial<GroceryItem>) => void;
  removeItem: (id: string) => void;
  addToPantry: (name: string) => void;
  removeFromPantry: (name: string) => void;
  /** Corrects an item's estimated price. Persists by canonical key + package/branch, so it survives the next regeneration even for plan-derived (non-manual) items. */
  updatePrice: (item: GroceryItem, pricePhp: number) => void;
  refresh: () => void;
}

/**
 * The grocery list: items generated from the next 7 days' plan (scaled to
 * `desiredServings`, priced against the SM catalog and any manual
 * corrections), plus manually-added/recipe-added extras, minus anything
 * pantry-owned — merged into one flat list for the Grocery screen to group
 * and render.
 */
export function useGroceryList(dietaryStyle: DietaryStyle, desiredServings: number): UseGroceryListResult {
  const [generated, setGenerated] = useState<GroceryItem[]>([]);
  const [extra, setExtra] = useState<GroceryItem[]>([]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [pantryItems, setPantryItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  const refresh = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    generateGroceryItems(dietaryStyle, desiredServings).then((result) => {
      if (active) {
        setGenerated(result);
        setLoading(false);
      }
    });
    setExtra(loadExtraGroceryItems());
    setChecked(loadCheckedItems());
    setPantryItems(loadPantryItems());
    return () => {
      active = false;
    };
  }, [dietaryStyle, desiredServings, reloadToken]);

  const items = useMemo(() => {
    const merged = [...generated, ...extra].map((item) => ({
      ...item,
      canonicalKey: item.canonicalKey ?? getCanonicalKey(item.name),
    }));
    return filterOutPantryItems(merged, pantryItems);
  }, [generated, extra, pantryItems]);

  const toggleChecked = useCallback((id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveCheckedItems(next);
      return next;
    });
  }, []);

  const clearChecked = useCallback(() => {
    setChecked({});
    saveCheckedItems({});
  }, []);

  const addItem = useCallback(
    (item: Omit<GroceryItem, "id">) => {
      const canonicalKey = item.canonicalKey ?? getCanonicalKey(item.name);
      addGroceryItems([{ ...item, canonicalKey, id: `extra-manual-${Date.now()}` }]);
      refresh();
    },
    [refresh],
  );

  const updateItem = useCallback(
    (id: string, patch: Partial<GroceryItem>) => {
      updateExtraGroceryItem(id, patch);
      refresh();
    },
    [refresh],
  );

  const removeItem = useCallback(
    (id: string) => {
      removeExtraGroceryItem(id);
      refresh();
    },
    [refresh],
  );

  const addToPantry = useCallback(
    (name: string) => {
      addPantryItem(name);
      refresh();
    },
    [refresh],
  );

  const removeFromPantry = useCallback(
    (name: string) => {
      removePantryItem(name);
      refresh();
    },
    [refresh],
  );

  const updatePrice = useCallback(
    (item: GroceryItem, pricePhp: number) => {
      const canonicalKey = item.canonicalKey ?? getCanonicalKey(item.name);
      const context = { packageAmount: item.packageAmount, packageUnit: item.packageUnit, branch: item.branch };
      const override: PriceOverride = {
        id: overrideId(canonicalKey, context),
        canonicalKey,
        pricePhp,
        priceSource: "manual-sm",
        packageAmount: item.packageAmount,
        packageUnit: item.packageUnit,
        productName: item.packageLabel,
        branch: item.branch,
        updatedAt: new Date().toISOString(),
      };
      savePriceOverride(override);
      refresh();
    },
    [refresh],
  );

  return {
    items,
    loading,
    checked,
    pantryItems,
    toggleChecked,
    clearChecked,
    addItem,
    updateItem,
    removeItem,
    addToPantry,
    removeFromPantry,
    updatePrice,
    refresh,
  };
}
