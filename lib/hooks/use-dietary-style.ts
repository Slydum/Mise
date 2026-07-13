"use client";

import { useEffect, useState } from "react";
import { loadDietaryStyle, saveDietaryStyle } from "@/lib/data/local-store";
import type { DietaryStyle } from "@/lib/types";
import { DEFAULT_DIETARY_STYLE } from "@/lib/types";

/**
 * Client-hydrated current eating style. Starts at the app default so the
 * first render matches the server; updates shortly after mount if the user
 * has previously chosen something else.
 */
export function useDietaryStyle() {
  const [dietaryStyle, setDietaryStyleState] = useState<DietaryStyle>(DEFAULT_DIETARY_STYLE);

  useEffect(() => {
    setDietaryStyleState(loadDietaryStyle());
  }, []);

  const setDietaryStyle = (style: DietaryStyle) => {
    setDietaryStyleState(style);
    saveDietaryStyle(style);
  };

  return { dietaryStyle, setDietaryStyle };
}
