"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string | null;
  className?: string;
}

/**
 * Minimal, self-contained toast — a subtle pill that fades in above the
 * bottom nav to confirm an action landed. Portaled to document.body: any
 * ancestor with an active CSS transform (e.g. our animate-fade-up screen
 * wrappers, which end at `transform: translateY(0)` rather than `none`)
 * would otherwise become the containing block for `fixed` descendants and
 * push this far off-screen on a tall page.
 */
export function Toast({ message, className }: ToastProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !message) return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-5 animate-fade-up",
        className,
      )}
    >
      <span className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-lift">
        <Check className="size-4" strokeWidth={3} aria-hidden />
        {message}
      </span>
    </div>,
    document.body,
  );
}
