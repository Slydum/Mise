"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { generateGroceryItems, normalizeIngredientName } from "@/lib/data/grocery-generator";
import {
  addGroceryItems,
  addPantryItem,
  loadCheckedItems,
  loadExtraGroceryItems,
  loadPantryItems,
  removeExtraGroceryItem,
  removePantryItem,
  saveCheckedItems,
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
  refresh: () => void;
}

/**
 * The grocery list: items generated from the next 7 days' plan, plus
 * manually-added/recipe-added extras, minus anything pantry-owned — merged
 * into one flat list for the Grocery screen to group and render.
 */
export function useGroceryList(dietaryStyle: DietaryStyle): UseGroceryListResult {
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
    generateGroceryItems(dietaryStyle).then((result) => {
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
  }, [dietaryStyle, reloadToken]);

  const items = useMemo(() => {
    const pantry = new Set(pantryItems.map(normalizeIngredientName));
    return [...generated, ...extra].filter((item) => !pantry.has(normalizeIngredientName(item.name)));
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
      addGroceryItems([{ ...item, id: `extra-manual-${Date.now()}` }]);
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
    refresh,
  };
}
