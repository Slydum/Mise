"use client";

import { useEffect, useRef, useState } from "react";

/** Shows a message for a couple seconds, then clears it. One toast at a time. */
export function useToast(durationMs = 1800) {
  const [message, setMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const showToast = (text: string) => {
    clearTimeout(timeoutRef.current);
    setMessage(text);
    timeoutRef.current = setTimeout(() => setMessage(null), durationMs);
  };

  return { message, showToast };
}
