"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { generateGroceryItems } from "@/lib/data/grocery-generator";
import { filterOutPantryItems } from "@/lib/grocery/aggregate";
import { getCanonicalKey } from "@/lib/grocery/ingredient-catalog";
import { purchaseRecordId, type PurchaseRecord, type PurchaseRecordPricingKind } from "@/lib/grocery/purchase-history";
import type { PriceAdapterParams } from "@/lib/pricing/types";
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

function buildPurchaseRecord(
  item: GroceryItem,
  pricePhp: number,
  storeId: string,
  source: PurchaseRecord["source"],
  pricingKind: PurchaseRecordPricingKind,
): PurchaseRecord {
  const canonicalKey = item.canonicalKey ?? getCanonicalKey(item.name);
  const isWeighted = pricingKind === "per-kg" || pricingKind === "per-liter";
  const context = {
    pricingKind,
    packageAmount: isWeighted ? undefined : item.packageAmount,
    packageUnit: isWeighted ? undefined : item.packageUnit,
  };
  return {
    id: purchaseRecordId(canonicalKey, storeId, source, context),
    canonicalKey,
    storeId,
    pricingKind,
    pricePhp,
    source,
    ...(isWeighted ? {} : { packageAmount: item.packageAmount, packageUnit: item.packageUnit }),
    productLabel: item.packageLabel,
    purchasedAt: new Date().toISOString(),
  };
}

export interface LoggedPriceAssignment {
  item: GroceryItem;
  pricePhp: number;
  pricingKind: PurchaseRecordPricingKind;
}

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
  /**
   * Logs a receipt price (what the user actually paid) or a manual
   * verification (confirmed accurate today, without necessarily buying) at
   * the given store — history/verification, never presented as a live
   * current price. The store doesn't have to be the current/default one;
   * any store the user names is logged. `pricingKind` defaults to
   * "package" (a flat price for the item's usual package); pass "per-kg"
   * or "per-liter" for produce priced by weight/volume at the till.
   */
  logPurchasePrice: (
    item: GroceryItem,
    pricePhp: number,
    storeId: string,
    source: PurchaseRecord["source"],
    pricingKind?: PurchaseRecordPricingKind,
  ) => void;
  /** Same as logPurchasePrice, for every assignment from a single receipt scan — one refresh instead of one per item. */
  logPurchasePrices: (assignments: LoggedPriceAssignment[], storeId: string, source: PurchaseRecord["source"]) => void;
  refresh: () => void;
}

/**
 * The grocery list: items generated from the next 7 days' plan (scaled to
 * `desiredServings`, priced per the unified PSA/DTI/SM model in
 * lib/pricing/ — see lib/data/grocery-generator.ts), plus
 * manually-added/recipe-added extras, minus anything pantry-owned — merged
 * into one flat list for the Grocery screen to group and render.
 */
export function useGroceryList(
  dietaryStyle: DietaryStyle,
  desiredServings: number,
  storeId: string | null,
  location: PriceAdapterParams = {},
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
    generateGroceryItems(dietaryStyle, desiredServings, storeId, location).then((result) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dietaryStyle, desiredServings, storeId, location.region, location.province, location.city, reloadToken]);

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

  const logPurchasePrice = useCallback(
    (
      item: GroceryItem,
      pricePhp: number,
      storeId: string,
      source: PurchaseRecord["source"],
      pricingKind: PurchaseRecordPricingKind = "package",
    ) => {
      savePurchaseRecord(buildPurchaseRecord(item, pricePhp, storeId, source, pricingKind));
      refresh();
    },
    [refresh],
  );

  const logPurchasePrices = useCallback(
    (assignments: LoggedPriceAssignment[], storeId: string, source: PurchaseRecord["source"]) => {
      for (const a of assignments) {
        savePurchaseRecord(buildPurchaseRecord(a.item, a.pricePhp, storeId, source, a.pricingKind));
      }
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
    logPurchasePrice,
    logPurchasePrices,
    refresh,
  };
}
