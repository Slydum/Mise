"use client";

import { useEffect, useState } from "react";
import {
  loadAllergies,
  loadExcludedIngredients,
  loadFavoriteIngredients,
  saveAllergies,
  saveExcludedIngredients,
  saveFavoriteIngredients,
} from "@/lib/data/local-store";

function addUnique(list: string[], value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed || list.some((v) => v.toLowerCase() === trimmed.toLowerCase())) return list;
  return [...list, trimmed];
}

/** Client-hydrated allergies, excluded ingredients, and favorite ingredients. */
export function useFoodPreferences() {
  const [allergies, setAllergies] = useState<string[]>([]);
  const [excludedIngredients, setExcludedIngredients] = useState<string[]>([]);
  const [favoriteIngredients, setFavoriteIngredients] = useState<string[]>([]);

  useEffect(() => {
    setAllergies(loadAllergies());
    setExcludedIngredients(loadExcludedIngredients());
    setFavoriteIngredients(loadFavoriteIngredients());
  }, []);

  const addAllergy = (value: string) =>
    setAllergies((prev) => {
      const next = addUnique(prev, value);
      saveAllergies(next);
      return next;
    });
  const removeAllergy = (value: string) =>
    setAllergies((prev) => {
      const next = prev.filter((v) => v !== value);
      saveAllergies(next);
      return next;
    });

  const addExcluded = (value: string) =>
    setExcludedIngredients((prev) => {
      const next = addUnique(prev, value);
      saveExcludedIngredients(next);
      return next;
    });
  const removeExcluded = (value: string) =>
    setExcludedIngredients((prev) => {
      const next = prev.filter((v) => v !== value);
      saveExcludedIngredients(next);
      return next;
    });

  const addFavorite = (value: string) =>
    setFavoriteIngredients((prev) => {
      const next = addUnique(prev, value);
      saveFavoriteIngredients(next);
      return next;
    });
  const removeFavorite = (value: string) =>
    setFavoriteIngredients((prev) => {
      const next = prev.filter((v) => v !== value);
      saveFavoriteIngredients(next);
      return next;
    });

  return {
    allergies,
    excludedIngredients,
    favoriteIngredients,
    addAllergy,
    removeAllergy,
    addExcluded,
    removeExcluded,
    addFavorite,
    removeFavorite,
  };
}
