"use client";

import { useEffect, useState } from "react";
import { loadCustomRecipes } from "@/lib/data/local-store";
import type { Recipe } from "@/lib/types";

/** Client-hydrated list of user-created recipes (quick custom meals and full created recipes alike). */
export function useCustomRecipes(): Recipe[] {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    setRecipes(Object.values(loadCustomRecipes()));
  }, []);

  return recipes;
}
