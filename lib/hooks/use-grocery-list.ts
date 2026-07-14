"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { generateGroceryItems } from "@/lib/data/grocery-generator";
import { filterOutPantryItems } from "@/lib/grocery/aggregate";
import { getCanonicalKey } from "@/lib/grocery/ingredient-catalog";
import { purchaseRecordId, type PurchaseRecord } from "@/lib/grocery/purchase-history";
import {
  addGroceryItems,
  addPantryItem,
  loadCheckedItems,
  loadExtraGroceryItems,
  loadPantryItems,
  removeExtraGroceryItem,
  removePantryItem,
  saveCheckedItems,
  savePurchaseRecord,
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
  addItem: (item: Omit<GroceryItem, "id" | "livePriceStatus">) => void;
  updateItem: (id: string, patch: Partial<GroceryItem>) => void;
  removeItem: (id: string) => void;
  addToPantry: (name: string) => void;
  removeFromPantry: (name: string) => void;
  /** Logs what the user actually paid at their selected store — history, never presented as a live price. No-ops without a selected store. */
  logPurchasePrice: (item: GroceryItem, pricePhp: number) => void;
  refresh: () => void;
}

/**
 * The grocery list: items generated from the next 7 days' plan (scaled to
 * `desiredServings`, priced only from the user's own purchase history at
 * `storeId` — there is no live SM Markets integration, see
 * lib/sm/adapter.ts), plus manually-added/recipe-added extras, minus
 * anything pantry-owned — merged into one flat list for the Grocery screen
 * to group and render.
 */
export function useGroceryList(
  dietaryStyle: DietaryStyle,
  desiredServings: number,
  storeId: string | null,
): UseGroceryListResult {
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
    generateGroceryItems(dietaryStyle, desiredServings, storeId).then((result) => {
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
  }, [dietaryStyle, desiredServings, storeId, reloadToken]);

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
    (item: Omit<GroceryItem, "id" | "livePriceStatus">) => {
      const canonicalKey = item.canonicalKey ?? getCanonicalKey(item.name);
      addGroceryItems([
        { ...item, canonicalKey, livePriceStatus: "unavailable", id: `extra-manual-${Date.now()}` },
      ]);
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

  const logPurchasePrice = useCallback(
    (item: GroceryItem, pricePhp: number) => {
      if (!storeId) return;
      const canonicalKey = item.canonicalKey ?? getCanonicalKey(item.name);
      const context = { packageAmount: item.packageAmount, packageUnit: item.packageUnit };
      const record: PurchaseRecord = {
        id: purchaseRecordId(canonicalKey, storeId, context),
        canonicalKey,
        storeId,
        pricePhp,
        packageAmount: item.packageAmount,
        packageUnit: item.packageUnit,
        productLabel: item.packageLabel,
        purchasedAt: new Date().toISOString(),
      };
      savePurchaseRecord(record);
      refresh();
    },
    [refresh, storeId],
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
    logPurchasePrice,
    refresh,
  };
}
