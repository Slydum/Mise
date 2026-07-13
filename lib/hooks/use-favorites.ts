"use client";

import { useEffect, useState } from "react";
import { loadFavorites } from "@/lib/data/local-store";

/** Client-hydrated favorites map, keyed by recipe id. */
export function useFavorites() {
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  const setFavorite = (recipeId: string, active: boolean) => {
    setFavorites((prev) => {
      const next = { ...prev };
      if (active) next[recipeId] = true;
      else delete next[recipeId];
      return next;
    });
  };

  return { favorites, setFavorite };
}
