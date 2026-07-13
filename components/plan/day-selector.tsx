"use client";

import { useEffect, useRef } from "react";
import { formatWeekdayShort, fromDateKey, isToday } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface DaySelectorProps {
  dateKeys: string[];
  selected: string;
  onSelect: (key: string) => void;
}

/** Horizontally scrollable strip of days; thumb-sized pill per day. */
export function DaySelector({ dateKeys, selected, onSelect }: DaySelectorProps) {
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [selected]);

  return (
    <div
      role="tablist"
      aria-label="Select day"
      className="flex gap-2 overflow-x-auto px-5 py-2 no-scrollbar"
    >
      {dateKeys.map((key) => {
        const date = fromDateKey(key);
        const active = key === selected;
        const today = isToday(key);
        return (
          <button
            key={key}
            ref={active ? selectedRef : undefined}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={`${formatWeekdayShort(date)} ${date.getDate()}${today ? ", today" : ""}`}
            onClick={() => onSelect(key)}
            className={cn(
              "flex h-[4.5rem] w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-3xl transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95",
              active
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "bg-card text-foreground border border-border/60",
            )}
          >
            <span
              className={cn(
                "text-[11px] font-medium uppercase tracking-wide",
                active ? "text-primary-foreground/80" : "text-muted-foreground",
              )}
            >
              {formatWeekdayShort(date)}
            </span>
            <span className="text-lg font-bold leading-none">{date.getDate()}</span>
            <span
              aria-hidden
              className={cn(
                "size-1 rounded-full",
                today ? (active ? "bg-primary-foreground" : "bg-primary") : "bg-transparent",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
