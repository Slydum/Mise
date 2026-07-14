"use client";

import { useEffect, useRef } from "react";
import { formatWeekdayShort, fromDateKey, isToday } from "@/lib/dates";
import type { DaySummary } from "@/lib/grocery";
import { cn } from "@/lib/utils";

interface DaySelectorProps {
  dateKeys: string[];
  selected: string;
  onSelect: (key: string) => void;
  /** Meal count, completion, and estimated cost per day — omitted keys render a plain chip while data loads. */
  summaries?: Record<string, DaySummary>;
}

const MAX_DOTS = 4;

function formatPhpShort(amount: number): string {
  if (amount <= 0) return "";
  return `₱${Math.round(amount).toLocaleString()}`;
}

/** Slim date rail — each chip also surfaces meal count, completion, and estimated cost for that day. */
export function DaySelector({ dateKeys, selected, onSelect, summaries }: DaySelectorProps) {
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [selected]);

  return (
    <div
      role="tablist"
      aria-label="Select day"
      className="flex gap-2 overflow-x-auto px-5 py-1 no-scrollbar"
    >
      {dateKeys.map((key) => {
        const date = fromDateKey(key);
        const active = key === selected;
        const today = isToday(key);
        const summary = summaries?.[key];
        const dotCount = summary ? Math.min(summary.mealCount, MAX_DOTS) : 0;
        const costLabel = summary ? formatPhpShort(summary.estimatedCostPhp) : "";

        return (
          <button
            key={key}
            ref={active ? selectedRef : undefined}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={`${formatWeekdayShort(date)} ${date.getDate()}${today ? ", today" : ""}${
              summary ? `, ${summary.mealCount} meals, ${summary.completedCount} done, about ${formatPhpShort(summary.estimatedCostPhp)}` : ""
            }`}
            onClick={() => onSelect(key)}
            className={cn(
              "flex h-20 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95",
              active ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground",
              today && !active && "ring-1 ring-inset ring-highlight",
            )}
          >
            <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">
              {formatWeekdayShort(date)}
            </span>
            <span className="font-serif text-lg leading-none">{date.getDate()}</span>
            {dotCount > 0 ? (
              <span className="flex items-center gap-0.5" aria-hidden>
                {Array.from({ length: dotCount }, (_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "size-1 rounded-full",
                      i < summary!.completedCount
                        ? active
                          ? "bg-primary-foreground"
                          : "bg-highlight"
                        : active
                          ? "bg-primary-foreground/40"
                          : "bg-muted-foreground/40",
                    )}
                  />
                ))}
              </span>
            ) : (
              <span className="h-1" aria-hidden />
            )}
            <span className="text-[9px] leading-none opacity-80">{costLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
