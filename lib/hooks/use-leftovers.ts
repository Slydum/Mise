"use client";

import { useCallback, useEffect, useState } from "react";
import { loadLeftovers } from "@/lib/data/local-store";
import type { LeftoverEntry } from "@/lib/types";

const AVAILABLE_MS = 3 * 24 * 60 * 60 * 1000;

/** Unconsumed, unexpired leftovers available to assign into a meal slot via "Use leftovers". */
export function useLeftovers() {
  const [leftovers, setLeftovers] = useState<LeftoverEntry[]>([]);

  const refresh = useCallback(() => {
    const now = Date.now();
    setLeftovers(
      loadLeftovers().filter((entry) => !entry.consumed && now - entry.createdAt <= AVAILABLE_MS),
    );
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { leftovers, refresh };
}
