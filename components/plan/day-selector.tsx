"use client";

import { useEffect, useRef } from "react";
import { formatWeekdayShort, fromDateKey, isToday } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface DaySelectorProps {
  dateKeys: string[];
  selected: string;
  onSelect: (key: string) => void;
}

/** Quiet, slim date rail — a light-touch utility, not the visual focus of the screen. */
export function DaySelector({ dateKeys, selected, onSelect }: DaySelectorProps) {
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
              "flex h-16 w-12 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95",
              active ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground",
            )}
          >
            <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">
              {formatWeekdayShort(date)}
            </span>
            <span className="font-serif text-lg leading-none">{date.getDate()}</span>
            <span
              aria-hidden
              className={cn(
                "size-1 rounded-full",
                today ? (active ? "bg-primary-foreground" : "bg-highlight") : "bg-transparent",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
