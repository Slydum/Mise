import type { ComponentType } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetActionRowProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
  onClick: () => void;
  showChevron?: boolean;
  destructive?: boolean;
  disabled?: boolean;
}

/** Shared row for sheet action menus (meal actions, add-meal, day actions). */
export function SheetActionRow({
  icon: Icon,
  label,
  hint,
  onClick,
  showChevron,
  destructive,
  disabled,
}: SheetActionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex min-h-14 w-full items-center gap-3.5 rounded-2xl px-3 text-left transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-muted disabled:opacity-50",
        destructive && "text-destructive",
      )}
    >
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-xl",
          destructive ? "bg-destructive/10 text-destructive" : "bg-accent text-accent-foreground",
        )}
      >
        <Icon className="size-4.5" aria-hidden />
      </span>
      <span className="flex-1">
        <span className="block font-medium">{label}</span>
        {hint ? <span className="block text-sm text-muted-foreground">{hint}</span> : null}
      </span>
      {showChevron ? <ChevronRight className="size-4 text-muted-foreground" aria-hidden /> : null}
    </button>
  );
}
