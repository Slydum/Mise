"use client";

import { BUDGET_LEVELS, BUDGET_LEVEL_LABELS } from "@/lib/types";
import type { BudgetLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BudgetSelectorProps {
  value: BudgetLevel | null;
  onChange: (value: BudgetLevel | null) => void;
}

/** Segmented pill picker for budget preference, with "Any" clearing the soft ranking boost. */
export function BudgetSelector({ value, onChange }: BudgetSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Budget preference" className="flex flex-wrap gap-2">
      <button
        type="button"
        role="radio"
        aria-checked={value === null}
        onClick={() => onChange(null)}
        className={cn(
          "h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring",
          value === null ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        Any
      </button>
      {BUDGET_LEVELS.map((level) => (
        <button
          key={level}
          type="button"
          role="radio"
          aria-checked={value === level}
          onClick={() => onChange(level)}
          className={cn(
            "h-10 shrink-0 rounded-full px-4 text-sm font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === level ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          {BUDGET_LEVEL_LABELS[level]}
        </button>
      ))}
    </div>
  );
}
