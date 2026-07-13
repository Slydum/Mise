"use client";

import { useEffect, useState } from "react";

/**
 * Minimal async-data hook for the provider layer. Returns `null` while
 * loading so screens can render skeletons. `loader` must be referentially
 * stable (module-level function or wrapped in useCallback).
 */
export function useData<T>(loader: () => Promise<T>): T | null {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    let active = true;
    loader().then((result) => {
      if (active) setData(result);
    });
    return () => {
      active = false;
    };
  }, [loader]);

  return data;
}
