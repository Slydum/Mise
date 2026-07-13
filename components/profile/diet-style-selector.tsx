"use client";

import { Check } from "lucide-react";
import { DIETARY_STYLES, DIETARY_STYLE_DESCRIPTIONS, DIETARY_STYLE_LABELS } from "@/lib/types";
import type { DietaryStyle } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DietStyleSelectorProps {
  value: DietaryStyle;
  onChange: (style: DietaryStyle) => void;
}

/** Eating-style picker — drives which recipes, plans, and grocery items show up app-wide. */
export function DietStyleSelector({ value, onChange }: DietStyleSelectorProps) {
  return (
    <ul className="flex flex-col divide-y divide-border/60">
      {DIETARY_STYLES.map((style) => {
        const selected = style === value;
        return (
          <li key={style}>
            <button
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(style)}
              className="flex w-full items-center gap-3.5 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150",
                  selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
                )}
              >
                {selected ? <Check className="size-3.5" strokeWidth={3} /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{DIETARY_STYLE_LABELS[style]}</span>
                <span className="block text-sm text-muted-foreground">
                  {DIETARY_STYLE_DESCRIPTIONS[style]}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
